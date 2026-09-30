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
import { workerRefineRunner } from './run-refine-worker.ts'

describe('workerRefineRunner', () => {
  let server: Server
  let calls: { method: string; path: string; body: unknown }[]
  let jobState: unknown

  beforeEach(async () => {
    calls = []
    jobState = {
      state: 'succeeded',
      result: {
        result_id: 'r-1',
        control: null,
        output: { json: { verdicts: [] } },
      },
    }
    const handle = async (
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> => {
      const body = await readRequestJson(request)
      {
        const method = request.method ?? ''
        const path = request.url ?? ''
        calls.push({ method, path, body })
        const payload =
          method === 'POST' && path === '/v1/jobs'
            ? { id: 'j-1', created: true }
            : method === 'GET'
              ? jobState
              : {}
        response.writeHead(200, { 'Content-Type': 'application/json' })
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
  })

  afterEach(async () => {
    vi.unstubAllEnvs()
    await new Promise((resolve) => server.close(resolve))
  })

  it('submits a task on the instance profile with no input files', async () => {
    const answer = await withFixtureSyntopicaConfig(async () =>
      workerRefineRunner({ pollMs: 0, waitMs: 1_000 }).run('1\tt\tt'),
    )
    expect(JSON.parse(answer ?? '')).toEqual({ verdicts: [] })
    const submit = calls[0]?.body as Record<string, unknown>
    expect(submit).toMatchObject({
      kind: 'task',
      queue: 'clips.refine',
      privacy: 'internal',
    })
    expect(String(submit['idempotency_key'])).toMatch(/^refine:[0-9a-f]{64}$/)
    const input = submit['input'] as Record<string, unknown>
    expect(input['profile']).toBe('clips.refine')
    expect(input['inputs']).toEqual([])
    expect(input['output_schema']).toBeTypeOf('object')
    expect(calls.at(-1)?.path).toBe('/v1/jobs/j-1/ack')
  })

  it("stops waiting on a task parked behind its runner's quota wall", async () => {
    jobState = { state: 'queued', result: null, cooling_until: 1e12 }
    const answer = await withFixtureSyntopicaConfig(async () =>
      workerRefineRunner({ pollMs: 0, waitMs: 60_000 }).run('1\tt\tt'),
    )
    expect(answer).toBeNull()
    expect(calls.filter((call) => call.method === 'GET')).toHaveLength(2)
  })
})
