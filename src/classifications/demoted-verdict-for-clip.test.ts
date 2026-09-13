import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import type { ClassificationVerdict } from './classification-verdict.ts'
import { demotedVerdictForClip } from './demoted-verdict-for-clip.ts'

const clip = {
  kind: 'clip',
  directory: '/tmp/clip',
  bucket: 'pending',
  metadata: {
    clip_id: '01KYFX6NFRDVW03ZFJXQ6W1VVG',
    normalized_url: 'https://example.com/a',
    clipped_from: 'mac-arm64-7735',
  },
  state: { status: 'pending' },
} as unknown as Clip

const tickedClip: Clip = {
  ...clip,
  metadata: { ...clip.metadata, clipped_from: 'clips-harvest' },
}

const verdicts = (bucket: string): Map<string, ClassificationVerdict> =>
  new Map([['https://example.com/a', { bucket, run: '2026-07-30/run.jsonl' }]])

describe('demotedVerdictForClip', () => {
  it('is null when the capture was never classified', () => {
    expect(demotedVerdictForClip(new Map(), clip)).toBeNull()
  })

  it('is null when the latest verdict is still ingest', () => {
    expect(demotedVerdictForClip(verdicts('ingest'), clip)).toBeNull()
  })

  it('returns the verdict when a later run demoted the capture', () => {
    expect(demotedVerdictForClip(verdicts('rejected'), clip)?.bucket).toBe(
      'rejected',
    )
  })

  it('treats an unavailable capture as demoted too', () => {
    expect(demotedVerdictForClip(verdicts('unavailable'), clip)?.run).toBe(
      '2026-07-30/run.jsonl',
    )
  })

  it('never demotes a capture the owner ticked', () => {
    expect(
      demotedVerdictForClip(verdicts('read-no-value'), tickedClip),
    ).toBeNull()
  })

  it('keeps the tick above a verdict of any bucket', () => {
    for (const bucket of ['rejected', 'review', 'unavailable'])
      expect(demotedVerdictForClip(verdicts(bucket), tickedClip)).toBeNull()
  })
})
