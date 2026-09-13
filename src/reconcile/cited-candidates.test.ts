import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { citedCandidates } from './cited-candidates.ts'

/** The normalized url the cited page points at. */
const POST_URL = 'https://example.com/post'
/** The page whose sources: list cites the post. */
const CITING_PAGE = 'topics/example.md'

const clip = (overrides: {
  clip_id: string
  normalized_url: string
  bucket?: Clip['bucket']
  snapshot_mode?: 'extracted' | 'omitted'
}): Clip =>
  ({
    kind: 'clip',
    directory: `/store/clips/${overrides.bucket ?? 'pending'}/2026/08/${overrides.clip_id}`,
    bucket: overrides.bucket ?? 'pending',
    metadata: {
      clip_id: overrides.clip_id,
      normalized_url: overrides.normalized_url,
      snapshot_mode: overrides.snapshot_mode ?? 'extracted',
    },
    state: { status: 'pending' },
  }) as unknown as Clip

const thin: ThinClip = {
  kind: 'thin',
  directory: '/store/clips/pending/2026/08/broken',
  bucket: 'pending',
  reason: 'metadata.json is not valid JSON',
} as unknown as ThinClip

describe('citedCandidates', () => {
  it('matches a pending clip whose url a page cites', () => {
    const clips = [
      clip({
        clip_id: '01ARZ3NDEKTSV4RRFFQ69G5FAA',
        normalized_url: POST_URL,
      }),
    ]
    const cited = new Map([[POST_URL, [CITING_PAGE]]])
    const result = citedCandidates(clips, cited)
    expect(result).toHaveLength(1)
    expect(result[0]?.pages).toEqual([CITING_PAGE])
  })

  it('matches on the medium post id, not the url spelling', () => {
    const clips = [
      clip({
        clip_id: '01ARZ3NDEKTSV4RRFFQ69G5FAB',
        normalized_url: 'https://someone.medium.com/a-title-8b5231d206b7',
      }),
    ]
    // The page cited the /@author spelling; the dedup key is the post id.
    const cited = new Map([['8b5231d206b7', [CITING_PAGE]]])
    expect(citedCandidates(clips, cited)).toHaveLength(1)
  })

  it('skips thin clips, other buckets, body-less clips and unmatched urls', () => {
    const clips = [
      thin,
      clip({
        clip_id: '01ARZ3NDEKTSV4RRFFQ69G5FAC',
        normalized_url: POST_URL,
        bucket: 'processed',
      }),
      clip({
        clip_id: '01ARZ3NDEKTSV4RRFFQ69G5FAD',
        normalized_url: POST_URL,
        snapshot_mode: 'omitted',
      }),
      clip({
        clip_id: '01ARZ3NDEKTSV4RRFFQ69G5FAE',
        normalized_url: 'https://example.com/uncited',
      }),
    ]
    const cited = new Map([[POST_URL, [CITING_PAGE]]])
    expect(citedCandidates(clips, cited)).toHaveLength(0)
  })

  it('copies the page list so a caller cannot mutate the shared map', () => {
    const clips = [
      clip({
        clip_id: '01ARZ3NDEKTSV4RRFFQ69G5FAF',
        normalized_url: POST_URL,
      }),
    ]
    const pages = [CITING_PAGE]
    const cited = new Map([[POST_URL, pages]])
    const result = citedCandidates(clips, cited)
    result[0]?.pages.push('topics/other.md')
    expect(pages).toEqual([CITING_PAGE])
  })
})
