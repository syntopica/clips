import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { formatStatusLine } from './format-status-line.ts'

const ESC = String.fromCharCode(27)
// Deviation from the brief's verbatim literals: sonarjs/no-duplicate-string
// flags each of these once it recurs across bucket, state, reason and
// assertion positions below, so they are named here instead of inlined
// every time.
const PENDING = 'pending' as const
const NO_METADATA_JSON = 'no metadata.json'

const clip = {
  kind: 'clip',
  directory:
    '/x/clips/pending/2026/07/2026-07-26-developer-mozilla-org-selection-01kyfxab',
  bucket: PENDING,
  metadata: {
    clip_id: '01KYFXABHY680TKQHM1WYG7FJG',
    site: 'developer.mozilla.org',
    title: 'Selection - Web APIs | MDN',
  },
} as unknown as Clip

describe('formatStatusLine', () => {
  it('names the clip, the state and the evidence', () => {
    const line = formatStatusLine(clip, {
      state: PENDING,
      reason: 'no ledger',
    })
    expect(line).toContain('01KYFXAB')
    expect(line).toContain('developer.mozilla.org')
    expect(line).toContain(PENDING)
    expect(line).toContain('no ledger')
  })

  it('names a thin clip by its directory, since it has no clip_id', () => {
    const thin: ThinClip = {
      kind: 'thin',
      directory: '/x/clips/pending/2026/07/2026-07-28-042951-mobile',
      bucket: PENDING,
      reason: NO_METADATA_JSON,
    }
    const line = formatStatusLine(thin, {
      state: 'unreadable',
      reason: NO_METADATA_JSON,
    })
    expect(line).toContain('2026-07-28-042951-mobile')
    expect(line).toContain('unreadable')
  })
})

describe('formatStatusLine, on text that came from an untrusted page', () => {
  // Every field below is page-derived, the directory slug included: it is built
  // from the page title. SPEC:388-390 requires them sanitized before they reach
  // a terminal, and an escape in any one of them can clear the reviewer's
  // screen or hide the line above it. One case per field, so an implementation
  // that sanitizes the title alone fails the other four.
  it('strips an escape out of the title', () => {
    const hostile = {
      ...clip,
      metadata: { ...clip.metadata, title: `a${ESC}[2Jb` },
    } as Clip
    const line = formatStatusLine(hostile, { state: PENDING, reason: 'x' })
    expect(line).not.toContain(ESC)
    expect(line).toContain('ab')
  })

  it('strips an escape out of the site', () => {
    const hostile = {
      ...clip,
      metadata: { ...clip.metadata, site: `evil${ESC}[2J.example` },
    } as Clip
    const line = formatStatusLine(hostile, { state: PENDING, reason: 'x' })
    expect(line).not.toContain(ESC)
  })

  it('strips an escape out of a thin clip directory name', () => {
    const thin: ThinClip = {
      kind: 'thin',
      directory: `/x/clips/pending/2026/07/2026-07-28-a${ESC}[2Jb-mobile`,
      bucket: PENDING,
      reason: NO_METADATA_JSON,
    }
    const line = formatStatusLine(thin, {
      state: 'unreadable',
      reason: NO_METADATA_JSON,
    })
    expect(line).not.toContain(ESC)
    expect(line).toContain('ab-mobile')
  })

  it('strips a newline that would forge a second status line', () => {
    const hostile = {
      ...clip,
      metadata: { ...clip.metadata, title: 'a\nreconciled   forged' },
    } as Clip
    const line = formatStatusLine(hostile, { state: PENDING, reason: 'x' })
    expect(line.split('\n')).toHaveLength(2)
  })

  it('strips an escape out of the reason', () => {
    const line = formatStatusLine(clip, {
      state: 'inconsistent',
      reason: `a${ESC}[2Jb`,
    })
    expect(line).not.toContain(ESC)
  })
})
