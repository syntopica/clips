import { describe, expect, it, vi } from 'vitest'

/** What this file guards is the ordering, not the mirror itself: the state is
 * published only after `pushClipsRepository` accepts the move, because nothing
 * may claim a bucket that origin/main does not yet show. Everything the clip
 * touches on disk and in git is mocked away, so only that sequence is under
 * test. */
vi.mock('../capture/mirror-clip-state.ts', () => ({
  mirrorClipState: vi.fn(async () => Promise.resolve()),
}))
vi.mock('./move-clip.ts', () => ({
  moveClip: vi.fn(async () => Promise.resolve()),
}))
vi.mock('./push-clips-repository.ts', () => ({
  pushClipsRepository: vi.fn(async () => Promise.resolve(true)),
}))
vi.mock('../git/ref-exists.ts', () => ({
  refExists: vi.fn(async () => Promise.resolve(true)),
}))
vi.mock('../git/path-exists-in-ref.ts', () => ({
  pathExistsInRef: vi.fn(async () => Promise.resolve(true)),
}))

const { mirrorClipState } = await import('../capture/mirror-clip-state.ts')
const { pushClipsRepository } = await import('./push-clips-repository.ts')
const { reconcileClip } = await import('./reconcile-clip.ts')
const { routeToNeedsClaude } = await import('./route-to-needs-claude.ts')

const URL = 'https://example.invalid/a'

const clip = {
  directory: '/repo/clips/pending/2026/08/a-clip',
  metadata: { clip_id: '01KYSGC20YDDHMJPHYF0XHAKR2', url: URL },
} as never

describe('reconcileClip', () => {
  it('mirrors the ingested state at the path the clip now has', async () => {
    vi.mocked(mirrorClipState).mockClear()
    await reconcileClip('/repo', '/brain', clip, 'abc1234')
    expect(mirrorClipState).toHaveBeenCalledWith({
      url: URL,
      state: 'ingested',
      clipDir: 'clips/processed/2026/08/a-clip',
    })
  })

  it('publishes nothing when the clips repository refused the move', async () => {
    vi.mocked(mirrorClipState).mockClear()
    vi.mocked(pushClipsRepository).mockResolvedValue(false)
    await expect(
      reconcileClip('/repo', '/brain', clip, 'abc1234'),
    ).rejects.toThrow('kept advancing')
    expect(mirrorClipState).not.toHaveBeenCalled()
    vi.mocked(pushClipsRepository).mockResolvedValue(true)
  })
})

describe('routeToNeedsClaude', () => {
  it('mirrors the needs-claude state at the path the clip now has', async () => {
    vi.mocked(mirrorClipState).mockClear()
    await routeToNeedsClaude('/repo', clip, {
      stage: 'validation',
      code: 'PATCH_REFUSED',
      message: 'refused',
    })
    expect(mirrorClipState).toHaveBeenCalledWith({
      url: URL,
      state: 'needs-claude',
      clipDir: 'clips/needs-claude/2026/08/a-clip',
    })
  })
})
