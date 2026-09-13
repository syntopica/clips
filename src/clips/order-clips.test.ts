import { describe, expect, it } from 'vitest'
import type { Clip } from './clip.ts'
import { orderClips } from './order-clips.ts'
import type { ThinClip } from './thin-clip.ts'

const clip = (clippedAt: string, clipId: string): Clip =>
  ({
    kind: 'clip',
    directory: `/tmp/${clipId}`,
    bucket: 'pending',
    metadata: { clipped_at: clippedAt, clip_id: clipId },
    state: {},
  }) as unknown as Clip

const thin = (directory: string): ThinClip => ({
  kind: 'thin',
  directory,
  bucket: 'pending',
  reason: 'no metadata.json',
})

describe('orderClips', () => {
  it('orders by clipped_at, then clip_id', () => {
    const ordered = orderClips([
      clip('2026-07-27T00:00:00Z', '01B'),
      clip('2026-07-26T00:00:00Z', '01C'),
      clip('2026-07-27T00:00:00Z', '01A'),
    ])
    expect(
      ordered.map((c) => (c.kind === 'clip' ? c.metadata.clip_id : '')),
    ).toEqual(['01C', '01A', '01B'])
  })

  it('puts thin clips last, ordered by directory, so the order stays total', () => {
    const ordered = orderClips([
      thin('/tmp/z'),
      clip('2026-07-26T00:00:00Z', '01A'),
      thin('/tmp/a'),
    ])
    expect(ordered.map((c) => c.directory)).toEqual([
      '/tmp/01A',
      '/tmp/a',
      '/tmp/z',
    ])
  })
})
