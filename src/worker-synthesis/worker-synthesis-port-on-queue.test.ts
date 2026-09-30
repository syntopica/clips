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
import { workerSynthesisPortOnQueue } from './worker-synthesis-port-on-queue.ts'

describe('workerSynthesisPortOnQueue', () => {
  let server: Server
  let calls: { method: string; path: string; body: unknown }[]
  let result: Record<string, unknown>

  beforeEach(async () => {
    calls = []
    result = {
      result_id: 'r-1',
      control: null,
      output: { json: { pages: [], needs_claude: false, reason: 'r' } },
      executor: { node: 'mini', provider: 'ollama', model: 'm' },
    }
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
          ? { id: 's-1', created: true }
          : method === 'GET'
            ? { state: 'succeeded', result }
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

  const infer = async (prompt: string, reserveBytes = 0) =>
    withFixtureSyntopicaConfig(async () => {
      const root = currentSyntopicaConfig().dataRoot
      mkdirSync(join(root, 'worker'), { recursive: true })
      writeFileSync(
        join(root, 'worker', 'config.json'),
        JSON.stringify({ models: { m: { num_ctx: 1000 } } }),
      )
      return workerSynthesisPortOnQueue('q.synthesis', timing, {}).infer(
        'write',
        prompt,
        { type: 'object' },
        reserveBytes,
      )
    })

  it('submits a tool-less personal inference job pinned to the worker model', async () => {
    const answer = await infer('the prompt')

    expect(answer).toEqual({
      text: JSON.stringify({ pages: [], needs_claude: false, reason: 'r' }),
      executor: { node: 'mini', provider: 'ollama', model: 'm' },
    })
    const submit = calls[0]?.body as Record<string, unknown>
    expect(submit).toMatchObject({
      kind: 'inference',
      queue: 'q.synthesis',
      privacy: 'personal',
      requirements: { capability: 'chat.json', models: ['m'] },
      input: {
        messages: [{ role: 'user', content: 'the prompt' }],
        schema: { type: 'object' },
      },
    })
    expect(String(submit['idempotency_key'])).toMatch(
      /^synthesis-write:[0-9a-f]{64}$/,
    )
  })

  it('refuses a prompt the pinned window cannot hold, sending nothing', async () => {
    // 1000 tokens at three bytes each is 3000 bytes, the prompt included.
    const answer = await infer('x'.repeat(2000), 1001)

    expect(answer).toEqual({
      failure: expect.stringMatching(/1000-token window/) as unknown,
    })
    expect(calls).toEqual([])
  })

  it('reports a job that ended without output as a failure', async () => {
    result = { result_id: 'r-1', control: 'failed', output: null }
    const answer = await infer('the prompt')

    expect(answer).toEqual({
      failure: expect.stringMatching(
        /s-1 on q.synthesis ended without an answer/,
      ) as unknown,
    })
  })
})
