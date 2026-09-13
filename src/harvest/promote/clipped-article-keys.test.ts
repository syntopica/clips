import { describe, expect, it } from 'vitest'
import type { Clip } from '../../clips/clip.ts'
import type { ThinClip } from '../../clips/thin-clip.ts'
import { clippedArticleKeys } from './clipped-article-keys.ts'

const clip = (normalizedUrl: string): Clip =>
  ({
    kind: 'clip',
    directory: '/store/clips/pending/2026/07/x',
    bucket: 'pending',
    metadata: { normalized_url: normalizedUrl },
    state: { status: 'pending' },
  }) as Clip

const thin: ThinClip = {
  kind: 'thin',
  directory: '/store/clips/pending/2026/07/mobile',
  bucket: 'pending',
  reason: 'no metadata.json',
}

describe('clippedArticleKeys', () => {
  it('collects the dedup key of every readable clip', () => {
    const clips = [
      clip('https://medium.com/@a/one-000000000001'),
      clip('https://medium.com/@a/two-000000000002'),
    ]

    expect(clippedArticleKeys(clips)).toEqual(
      new Set(['000000000001', '000000000002']),
    )
  })

  it('gives one key to a post already clipped under another URL spelling', () => {
    const clips = [
      clip('https://medium.com/@shailesh-sharma/spec-driven-8b5231d206b7'),
      clip('https://shailesh-sharma.medium.com/spec-driven-8b5231d206b7'),
    ]

    expect(clippedArticleKeys(clips)).toEqual(new Set(['8b5231d206b7']))
  })

  it('ignores thin clips, which have no metadata to compare against', () => {
    expect(clippedArticleKeys([thin])).toEqual(new Set())
  })
})
