import { afterEach, describe, expect, it, vi } from 'vitest'
import { mirrorClipState } from './mirror-clip-state.ts'

const CAPTURE_TOKEN = 'test-token'

// The origin is one instance's configuration, and this file is about what the
// mirror sends, not about whose service it sends to. Stubbed so the test runs
// in a checkout that has selected no instance at all.
vi.mock('./capture-service-origin.ts', () => ({
  captureServiceOrigin: () => 'https://capture.example',
}))

const input = {
  url: 'https://example.invalid/a',
  state: 'ingested' as const,
  clipDir: 'clips/processed/2026/08/a-clip',
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('mirrorClipState', () => {
  it('sends nothing at all from a test run, unless a test asks for it', async () => {
    vi.stubEnv('CAPTURE_TOKEN', CAPTURE_TOKEN)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await mirrorClipState(input)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('records the URL, then pushes the state to the capture it names', async () => {
    vi.stubEnv('CAPTURE_MIRROR', 'on')
    vi.stubEnv('CAPTURE_TOKEN', CAPTURE_TOKEN)
    const calls: { url: string; method: string; body: unknown }[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({
          url,
          method: init?.method ?? 'GET',
          body: typeof init?.body === 'string' ? JSON.parse(init.body) : null,
        })
        return Promise.resolve(
          new Response(JSON.stringify({ data: { capture_id: '01KY' } }), {
            status: 201,
          }),
        )
      }),
    )

    await mirrorClipState(input)

    expect(calls[0]?.method).toBe('POST')
    expect(calls[0]?.url).toContain('/api/capture')
    expect(calls[1]?.method).toBe('PATCH')
    expect(calls[1]?.url).toContain('/api/captures/01KY')
    expect(calls[1]?.body).toStrictEqual({
      state: 'ingested',
      clip_dir: 'clips/processed/2026/08/a-clip',
    })
  })

  it('sends nothing for a vexa:// identity the service cannot hold', async () => {
    vi.stubEnv('CAPTURE_MIRROR', 'on')
    vi.stubEnv('CAPTURE_TOKEN', CAPTURE_TOKEN)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await mirrorClipState({
      ...input,
      url: 'vexa://kube.today/newsletter/some-issue',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('swallows a service that is down, because the ledger is the truth', async () => {
    vi.stubEnv('CAPTURE_MIRROR', 'on')
    vi.stubEnv('CAPTURE_TOKEN', CAPTURE_TOKEN)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('ECONNREFUSED'))),
    )
    await expect(mirrorClipState(input)).resolves.toBeUndefined()
  })

  it('swallows a refusal from the service rather than failing an ingest', async () => {
    vi.stubEnv('CAPTURE_MIRROR', 'on')
    vi.stubEnv('CAPTURE_TOKEN', CAPTURE_TOKEN)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('', { status: 401 }))),
    )
    await expect(mirrorClipState(input)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledOnce()
  })

  it('swallows a missing token rather than failing an ingest', async () => {
    vi.stubEnv('CAPTURE_MIRROR', 'on')
    vi.stubEnv('CAPTURE_TOKEN', '')
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(mirrorClipState(input)).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
