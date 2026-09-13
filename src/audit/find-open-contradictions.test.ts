import { describe, expect, it } from 'vitest'
import { brainWith } from './brain-fixture.ts'
import { findOpenContradictions } from './find-open-contradictions.ts'

/** The check name every finding of this audit carries. */
const OPEN_CONTRADICTION = 'open-contradiction'

describe('findOpenContradictions', () => {
  it('lists every entry a page declares', async () => {
    const brain = brainWith({
      'business/a.md': `---\ntitle: t\ntype: business\nupdated: 2026-08-02\ncontradictions:\n  - the 303 figure differs from [[business/b]], both cited\n  - the domain count is 122 in the vault and 123 on disk\nsources:\n  - SCHEMA.md\n---\n\nbody\n`,
    })

    expect(await findOpenContradictions(brain)).toEqual([
      {
        check: OPEN_CONTRADICTION,
        subject: 'business/a.md',
        detail: 'the 303 figure differs from [[business/b]], both cited',
      },
      {
        check: OPEN_CONTRADICTION,
        subject: 'business/a.md',
        detail: 'the domain count is 122 in the vault and 123 on disk',
      },
    ])
  })

  it('says nothing about a page that declares none', async () => {
    const brain = brainWith({
      'topics/a.md': '---\ntitle: t\nupdated: 2026-08-02\n---\n\nbody\n',
    })

    expect(await findOpenContradictions(brain)).toEqual([])
  })

  it('stops at the next frontmatter key', async () => {
    // `sources:` follows `contradictions:` in SCHEMA's field order, and a
    // source read as a contradiction would report a url as a disagreement.
    const brain = brainWith({
      'topics/a.md': `---\ntitle: t\ncontradictions:\n  - one real disagreement\nsources:\n  - https://example.com/a\n---\n\nbody\n`,
    })

    expect(await findOpenContradictions(brain)).toEqual([
      {
        check: OPEN_CONTRADICTION,
        subject: 'topics/a.md',
        detail: 'one real disagreement',
      },
    ])
  })

  it('folds a wrapped entry back into one line', async () => {
    // Reported truncated at the first line otherwise, which is the failure mode
    // a check is least able to afford: quietly saying less than it found.
    const brain = brainWith({
      'business/a.md': `---\ntitle: t\ncontradictions:\n  - the pack says 59 documents / 2,901.34\n    and the audit says 69 / 3,288.86\n---\n\nbody\n`,
    })

    expect(await findOpenContradictions(brain)).toEqual([
      {
        check: OPEN_CONTRADICTION,
        subject: 'business/a.md',
        detail:
          'the pack says 59 documents / 2,901.34 and the audit says 69 / 3,288.86',
      },
    ])
  })

  it('names the authority spread when the page cites more than one tier', async () => {
    const brain = brainWith({
      'topics/a.md': `---\ntitle: t\ncontradictions:\n  - the thread says 512, the release notes say 1024\nsources:\n  - https://x.com/someone/status/1\n  - https://example.org/release-notes\n---\n\nbody\n`,
    })

    expect(await findOpenContradictions(brain)).toEqual([
      {
        check: OPEN_CONTRADICTION,
        subject: 'topics/a.md',
        detail:
          'the thread says 512, the release notes say 1024 [sources: web > social]',
      },
    ])
  })

  it('never reads the body, where the word appears in prose', async () => {
    const brain = brainWith({
      'topics/a.md':
        '---\ntitle: t\n---\n\ncontradictions:\n  - not frontmatter\n',
    })

    expect(await findOpenContradictions(brain)).toEqual([])
  })
})
