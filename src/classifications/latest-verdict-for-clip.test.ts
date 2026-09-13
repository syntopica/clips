import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import type { ClassificationVerdict } from './classification-verdict.ts'
import { latestVerdictForClip } from './latest-verdict-for-clip.ts'

const clip = {
  kind: 'clip',
  directory: '/tmp/clip',
  bucket: 'pending',
  metadata: {
    clip_id: '01KYFX6NFRDVW03ZFJXQ6W1VVG',
    normalized_url: 'https://example.com/a',
  },
  state: { status: 'pending' },
} as unknown as Clip

const verdict = (bucket: string): ClassificationVerdict => ({
  bucket,
  run: '2026-07-29/run.jsonl',
})

describe('latestVerdictForClip', () => {
  it('returns null when the capture was never classified', () => {
    expect(latestVerdictForClip(new Map(), clip)).toBeNull()
  })

  it('prefers the normalized_url entry over the clip_id one', () => {
    const verdicts = new Map([
      ['https://example.com/a', verdict('ingest')],
      ['01KYFX6NFRDVW03ZFJXQ6W1VVG', verdict('rejected')],
    ])
    expect(latestVerdictForClip(verdicts, clip)?.bucket).toBe('ingest')
  })

  it('falls back to the clip_id when only that key exists', () => {
    const verdicts = new Map([
      ['01KYFX6NFRDVW03ZFJXQ6W1VVG', verdict('review')],
    ])
    expect(latestVerdictForClip(verdicts, clip)?.bucket).toBe('review')
  })
})
