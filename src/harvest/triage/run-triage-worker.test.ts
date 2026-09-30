import { writeFileSync } from 'node:fs'
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { readRequestJson } from '../../testing/read-request-json.ts'
import { temporaryDir } from '../../testing/temporary-dir.ts'
import { withFixtureSyntopicaConfig } from '../../testing/with-fixture-syntopica-config.ts'
import { workerTriageRunner } from './run-triage-worker.ts'

type Route = (method: string, path: string, body: unknown) => [number, unknown]

const withConfig = withFixtureSyntopicaConfig

describe('workerTriageRunner', () => {
  let server: Server
  let calls: { method: string; path: string; body: unknown; auth: string }[]
  let route: Route

  beforeEach(async () => {
    calls = []
    const handle = async (
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> => {
      const body = await readRequestJson(request)
      {
        const method = request.method ?? ''
        const path = request.url ?? ''
        calls.push({
          method,
          path,
          body,
          auth: request.headers.authorization ?? '',
        })
        const [status, payload] = route(method, path, body)
        response.writeHead(status, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify(payload))
      }
    }
    server = createServer((request, response) => {
      void handle(request, response)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const tokenFile = join(temporaryDir('clips-worker-'), 'clips.token')
    writeFileSync(tokenFile, 'tok\n')
    const { port } = server.address() as AddressInfo
    vi.stubEnv('CLIPS_WORKER_URL', `http://127.0.0.1:${String(port)}/`)
    vi.stubEnv('CLIPS_WORKER_TOKEN_FILE', tokenFile)
    vi.stubEnv('CLIPS_WORKER_MODEL', 'model-a')
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await new Promise((resolve) => server.close(resolve))
  })

  const timing = { pollMs: 0, waitMs: 1_000 }

  it('submits a local-only inference job and returns the acknowledged output', async () => {
    const verdicts = {
      verdicts: [{ id: 1, bucket: 'ingest', topic: 'other', reason: 'r' }],
    }
    route = (method, path) => {
      if (method === 'POST' && path === '/v1/jobs')
        return [201, { id: 'j-1', created: true }]
      if (method === 'GET' && path === '/v1/jobs/j-1')
        return [
          200,
          {
            state: 'succeeded',
            result: {
              result_id: 'r-1',
              control: null,
              output: { json: verdicts },
            },
          },
        ]
      return [200, {}]
    }
    const answer = await withConfig(async () =>
      workerTriageRunner(timing).run('1\tA title\ta title'),
    )
    expect(JSON.parse(answer ?? '')).toEqual(verdicts)
    const submit = calls[0]?.body as Record<string, unknown>
    expect(calls[0]?.auth).toBe('Bearer tok')
    expect(submit['privacy']).toBe('personal')
    expect(submit['queue']).toBe('clips.triage')
    expect(submit['requirements']).toEqual({
      capability: 'chat.json',
      models: ['model-a'],
    })
    expect(String(submit['idempotency_key'])).toMatch(/^triage:[0-9a-f]{64}$/)
    expect(calls.at(-1)).toMatchObject({
      method: 'POST',
      path: '/v1/jobs/j-1/ack',
      body: { result_id: 'r-1', decline: false },
    })
  })

  it('degrades a failed job to null after acknowledging it', async () => {
    route = (method, path) => {
      if (method === 'POST' && path === '/v1/jobs')
        return [201, { id: 'j-2', created: true }]
      if (method === 'GET')
        return [
          200,
          {
            state: 'failed',
            result: { result_id: 'r-2', control: 'failed', output: null },
          },
        ]
      return [200, {}]
    }
    await expect(
      withConfig(async () => workerTriageRunner(timing).run('1\tt\tt')),
    ).resolves.toBeNull()
    expect(calls.at(-1)?.path).toBe('/v1/jobs/j-2/ack')
  })

  it('walks past a key whose job already ended with nothing to collect', async () => {
    route = (method, path, body) => {
      if (method === 'POST' && path === '/v1/jobs') {
        const key = (body as { idempotency_key: string }).idempotency_key
        return [
          200,
          { id: key.endsWith(':r1') ? 'fresh' : 'spent', created: false },
        ]
      }
      if (path === '/v1/jobs/spent')
        return [200, { state: 'succeeded', result: null }]
      if (path === '/v1/jobs/fresh' && method === 'GET')
        return [200, { state: 'queued', result: null }]
      return [200, {}]
    }
    const answer = await withConfig(async () =>
      workerTriageRunner({ pollMs: 0, waitMs: 0 }).run('1\tt\tt'),
    )
    expect(answer).toBeNull()
    const keys = calls
      .filter((call) => call.path === '/v1/jobs')
      .map((call) => (call.body as { idempotency_key: string }).idempotency_key)
    expect(keys[1]).toBe(`${keys[0] ?? ''}:r1`)
  })

  it('declines a split and keeps waiting for the output', async () => {
    let reads = 0
    route = (method, path) => {
      if (method === 'POST' && path === '/v1/jobs')
        return [201, { id: 'j-3', created: true }]
      if (method === 'GET' && path === '/v1/jobs/j-3') {
        reads += 1
        if (reads === 1) return [200, { state: 'queued', result: null }]
        if (reads === 2)
          return [
            200,
            {
              state: 'queued',
              result: {
                result_id: 's',
                control: 'split_requested',
                output: null,
              },
            },
          ]
        return [
          200,
          {
            state: 'succeeded',
            result: { result_id: 'r-3', control: null, output: { text: '{}' } },
          },
        ]
      }
      return [200, {}]
    }
    const answer = await withConfig(async () =>
      workerTriageRunner(timing).run('1\tt\tt'),
    )
    expect(answer).toBe('{}')
    const acks = calls
      .filter((call) => call.path.endsWith('/ack'))
      .map((call) => call.body)
    expect(acks).toEqual([
      { result_id: 's', decline: true },
      { result_id: 'r-3', decline: false },
    ])
  })
})
