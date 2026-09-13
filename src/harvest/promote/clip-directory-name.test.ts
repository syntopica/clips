import { describe, expect, it } from 'vitest'
import { clipDirectoryName } from './clip-directory-name.ts'
import { MAX_CLIP_DIR_NAME_CHARS } from './max-clip-dir-name-chars.ts'

const CLIP_DATE = '2026-07-29'
const CLIP_SITE = 'medium.com'

describe('clipDirectoryName', () => {
  it('reads as date, site, title and id', () => {
    expect(
      clipDirectoryName(
        CLIP_DATE,
        CLIP_SITE,
        'Agent Memory',
        '01KYNM2FHGCRDYJ1NZ57TXS2GR',
      ),
    ).toBe('2026-07-29-medium-com-agent-memory-01kynm2f')
  })

  it('folds the punctuation Medium titles are full of', () => {
    const name = clipDirectoryName(
      CLIP_DATE,
      CLIP_SITE,
      'I Replaced My $400/Month Bill — Here’s How 🚀',
      '01KYNM2FHGCRDYJ1NZ57TXS2GR',
    )
    expect(name).toMatch(/^[a-z0-9-]+$/u)
    expect(name).not.toContain('--')
  })

  it('stays inside the budget by truncating the title, not the id', () => {
    const name = clipDirectoryName(
      CLIP_DATE,
      CLIP_SITE,
      'A'.repeat(400),
      '01KYNM2FHGCRDYJ1NZ57TXS2GR',
    )
    expect(name.length).toBeLessThanOrEqual(MAX_CLIP_DIR_NAME_CHARS)
    expect(name.endsWith('01kynm2f')).toBe(true)
  })

  it('does not leave a dangling hyphen when the title is dropped entirely', () => {
    expect(
      clipDirectoryName(
        CLIP_DATE,
        CLIP_SITE,
        '🚀',
        '01KYNM2FHGCRDYJ1NZ57TXS2GR',
      ),
    ).toBe('2026-07-29-medium-com-01kynm2f')
  })
})
