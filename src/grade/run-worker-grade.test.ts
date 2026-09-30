import { mkdirSync, writeFileSync } from 'node:fs'
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { readRequestJson } from '../testing/read-request-json.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { withFixtureSyntopicaConfig } from '../testing/with-fixture-syntopica-config.ts'
import { workerGradeRunner } from './run-worker-grade.ts'

describe('workerGradeRunner', () => {
  let server: Server
  let calls: { method: string; path: string; body: unknown }[]

  beforeEach(async () => {
    calls = []
    const handle = async (
      request: IncomingMessage,
      response: ServerResponse,
    ): Promise<void> => {
      const body = await readRequestJson(request)
      const method = request.method ?? ''
      const path = request.url ?? ''
      calls.push({ method, path, body })
      const payload =
        method === 'POST' && path === '/v1/jobs'
          ? { id: 'g-1', created: true }
          : method === 'GET'
            ? {
                state: 'succeeded',
                result: {
                  result_id: 'r-1',
                  control: null,
                  output: { json: { verdict: 'clean' } },
                },
              }
            : {}
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify(payload))
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

  const timing = { pollMs: 0, waitMs: 1_000 }

  it('sends the page and its evidence as a manifest under the instance', async () => {
    const run = await withFixtureSyntopicaConfig(async () => {
      const root = currentSyntopicaConfig().dataRoot
      mkdirSync(join(root, 'clips'), { recursive: true })
      return workerGradeRunner('codex', timing).run(
        root,
        join(root, 'brain', 'topics', 'a.md'),
        [join(root, 'clips', 'b.md')],
      )
    })
    expect(run).toEqual({
      exitCode: 0,
      lastMessage: JSON.stringify({ verdict: 'clean' }),
      stderrTail: '',
    })
    const submit = calls[0]?.body as Record<string, unknown>
    expect(submit).toMatchObject({
      kind: 'task',
      queue: 'clips.grade',
      privacy: 'internal',
    })
    const input = submit['input'] as Record<string, unknown>
    expect(input['runner']).toBe('codex')
    expect(input['inputs']).toEqual(['brain/topics/a.md', 'clips/b.md'])
    expect(String(input['prompt'])).toContain(
      'The page is at brain/topics/a.md.',
    )
  })

  it('fails a page whose evidence lies outside the instance, sending nothing', async () => {
    const run = await withFixtureSyntopicaConfig(async () => {
      const root = currentSyntopicaConfig().dataRoot
      return workerGradeRunner('codex', timing).run(
        root,
        join(root, 'brain', 'a.md'),
        ['/elsewhere/b.md'],
      )
    })
    expect(run.exitCode).toBe(1)
    expect(run.stderrTail).toMatch(/outside the instance/)
    expect(calls).toEqual([])
  })
})
