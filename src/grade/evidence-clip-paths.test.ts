import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { evidenceClipPaths } from './evidence-clip-paths.ts'

const ONE_URL = 'https://medium.com/@a/one-000000000001'

const clip = (directory: string, normalizedUrl: string): Clip =>
  ({
    kind: 'clip',
    directory,
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

describe('evidenceClipPaths', () => {
  it('matches a cited url to the clip that holds it', () => {
    expect(
      evidenceClipPaths(
        [ONE_URL],
        [
          clip('/store/one', ONE_URL),
          clip('/store/two', 'https://medium.com/@a/two-000000000002'),
        ],
      ),
    ).toEqual(['/store/one/index.md'])
  })

  it('matches the same Medium post under another url spelling', () => {
    expect(
      evidenceClipPaths(
        ['https://a.medium.com/one-000000000001'],
        [clip('/store/one', ONE_URL)],
      ),
    ).toEqual(['/store/one/index.md'])
  })

  it('ignores thin clips, which carry no url to match on', () => {
    expect(evidenceClipPaths([ONE_URL], [thin])).toEqual([])
  })

  it('returns nothing when no cited url is in the store', () => {
    expect(
      evidenceClipPaths(
        ['https://example.com/never-clipped'],
        [clip('/store/one', ONE_URL)],
      ),
    ).toEqual([])
  })
})
