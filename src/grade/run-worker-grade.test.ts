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
  let executor: { provider: string; model: string }

  beforeEach(async () => {
    calls = []
    executor = { provider: 'agy', model: 'gemini-3.1-pro-high' }
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
                  executor,
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

  /** A fixture instance with a page, one clip and a worker pinning one model
   * of a 40960-token window, graded under `forbidden`. */
  const gradeFixture = async (
    forbidden: readonly string[] | null,
    clipText = 'evidence',
    maxPayload?: number,
  ): ReturnType<ReturnType<typeof workerGradeRunner>['run']> =>
    withFixtureSyntopicaConfig(async () => {
      const root = currentSyntopicaConfig().dataRoot
      mkdirSync(join(root, 'clips'), { recursive: true })
      mkdirSync(join(root, 'worker'), { recursive: true })
      mkdirSync(join(root, 'brain', 'topics'), { recursive: true })
      writeFileSync(
        join(root, 'worker', 'config.json'),
        JSON.stringify({
          models: { 'qwen3.6:35b': { num_ctx: 40_960 } },
          ...(maxPayload === undefined
            ? {}
            : { max_payload_bytes: maxPayload }),
        }),
      )
      writeFileSync(join(root, 'clips', 'b.md'), clipText)
      writeFileSync(join(root, 'brain', 'topics', 'a.md'), 'The page [S1].')
      return workerGradeRunner(forbidden, timing, {}).run(
        root,
        join(root, 'brain', 'topics', 'a.md'),
        [join(root, 'clips', 'b.md')],
      )
    })

  it('sends the page and its evidence inlined in one inference job', async () => {
    const run = await gradeFixture(['codex'])
    expect(run).toEqual({
      exitCode: 0,
      lastMessage: JSON.stringify({ verdict: 'clean' }),
      stderrTail: '',
    })
    const submit = calls[0]?.body as Record<string, unknown>
    expect(submit).toMatchObject({
      kind: 'inference',
      queue: 'clips.grade',
      privacy: 'internal',
      requirements: { models: ['qwen3.6:35b'] },
    })
    const input = submit['input'] as {
      messages: { content: string }[]
      schema: { required: string[] }
    }
    const prompt = input.messages[0]?.content ?? ''
    expect(prompt).toContain('=== SOURCE: clips/b.md ===\nevidence')
    expect(prompt).toContain('=== PAGE: brain/topics/a.md ===\nThe page [S1].')
    expect(prompt).toContain('The page is at brain/topics/a.md.')
    // The codex grader's full output contract, markers included.
    expect(input.schema.required).toContain('misattributed')
  })

  it('discards a verdict from the tier that wrote the page', async () => {
    executor = { provider: 'openrouter', model: 'qwen/qwen3.8-27b:free' }
    const run = await gradeFixture(['openrouter'])
    expect(run.exitCode).toBe(1)
    expect(run.lastMessage).toBeNull()
    expect(run.stderrTail).toMatch(/openrouter tier that wrote this page/)
  })

  it('discards a local verdict on a prompt over the local window', async () => {
    executor = { provider: 'ollama', model: 'qwen3.6:35b' }
    const run = await gradeFixture(null, 'x'.repeat(200 * 1024))
    expect(run.exitCode).toBe(1)
    expect(run.stderrTail).toMatch(/cannot hold/)
  })

  it('refuses a job over the worker payload ceiling, sending nothing', async () => {
    const run = await gradeFixture(null, 'evidence', 1_000)
    expect(run.exitCode).toBe(1)
    expect(run.stderrTail).toMatch(/1000-byte max_payload_bytes/)
    expect(calls).toEqual([])
  })
})
