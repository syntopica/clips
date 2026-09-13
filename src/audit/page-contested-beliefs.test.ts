import { describe, expect, it } from 'vitest'
import { pageContestedBeliefs } from './page-contested-beliefs.ts'

describe('pageContestedBeliefs', () => {
  it('reads the entries of a contested section', () => {
    expect(
      pageContestedBeliefs(
        [
          '# Page',
          '',
          '## Contested',
          '',
          '- 2026-08-01: held A; now B, because the repository outranks the post.',
          '- 2026-08-02: held C; now D, because the owner said so.',
        ].join('\n'),
      ),
    ).toEqual([
      '2026-08-01: held A; now B, because the repository outranks the post.',
      '2026-08-02: held C; now D, because the owner said so.',
    ])
  })

  it('folds a wrapped entry, which is the normal shape here', () => {
    expect(
      pageContestedBeliefs(
        [
          '## Contested',
          '',
          '- 2026-08-01: held A; now B,',
          '  because X.',
        ].join('\n'),
      ),
    ).toEqual(['2026-08-01: held A; now B, because X.'])
  })

  it('stops at the next section, so later prose is not read as history', () => {
    expect(
      pageContestedBeliefs(
        [
          '## Contested',
          '',
          '- 2026-08-01: held A; now B.',
          '',
          '## Sources',
          '',
          '- https://a.example/',
        ].join('\n'),
      ),
    ).toEqual(['2026-08-01: held A; now B.'])
  })

  it('says nothing about a page with no contested section, which is all of them', () => {
    expect(pageContestedBeliefs('# Page\n\nProse.\n')).toEqual([])
  })
})
