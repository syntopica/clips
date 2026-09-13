import { describe, expect, it } from 'vitest'
import { brainWith } from './brain-fixture.ts'
import { findUndatedSupersessions } from './find-undated-supersessions.ts'

const page = (body: string): string =>
  `---\ntitle: t\ntype: topic\nupdated: 2026-08-03\nsources:\n  - SCHEMA.md\n---\n\n${body}\n`

describe('findUndatedSupersessions', () => {
  it('reports a contested entry that says when nothing', async () => {
    const brain = brainWith({
      'topics/a.md': page(
        '## Contested\n\n- the page held A; it now holds B, because the repository outranks it.',
      ),
    })

    expect(await findUndatedSupersessions(brain)).toEqual([
      {
        check: 'undated-supersession',
        subject: 'topics/a.md',
        detail:
          'contested entry with no date: the page held A; it now holds B, because the repository outranks it.',
      },
    ])
  })

  it('says nothing about a dated entry, however many there are', async () => {
    const brain = brainWith({
      'topics/a.md': page(
        [
          '## Contested',
          '',
          '- 2026-08-01: held A; now B, because the repository outranks the post.',
          '- 2026-08-02: held C; now D, because the owner said so.',
        ].join('\n'),
      ),
    })

    expect(await findUndatedSupersessions(brain)).toEqual([])
  })

  it('is silent on a page with no contested section', async () => {
    const brain = brainWith({ 'topics/a.md': page('Ordinary prose.') })

    expect(await findUndatedSupersessions(brain)).toEqual([])
  })
})
