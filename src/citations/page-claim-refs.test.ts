import { describe, expect, it } from 'vitest'
import { pageClaimRefs } from './page-claim-refs.ts'

const page = (body: string): string =>
  `---
title: T
sources:
  - https://a.example/
---

${body}
`

describe('pageClaimRefs', () => {
  it('finds the markers in prose, in first-appearance order', () => {
    expect(
      pageClaimRefs(
        page(
          'The body says one thing [S2]. And another [OWN]. And a third [S1].',
        ),
      ),
    ).toEqual(['S2', 'OWN', 'S1'])
  })

  it('reports each ref once however often it is cited', () => {
    expect(pageClaimRefs(page('One [S1]. Two [S1]. Three [S1].'))).toEqual([
      'S1',
    ])
  })

  it('reads the rewritten form as the same marker', () => {
    expect(pageClaimRefs(page('A rewritten claim [[S1]](#sources).'))).toEqual([
      'S1',
    ])
  })

  it('reads nothing out of the frontmatter block', () => {
    // The frontmatter here carries a url whose slug contains [S1]; nothing in
    // frontmatter is a claim, which is the finding `withoutFrontmatter` exists
    // for.
    expect(
      pageClaimRefs(`---
title: T
sources:
  - https://a.example/why-[S1]-matters
---

Prose with no markers.
`),
    ).toEqual([])
  })

  it('reads nothing out of the ## Sources section', () => {
    expect(
      pageClaimRefs(
        page(
          'Prose with no markers.\n\n## Sources\n\n- [S1] https://a.example/',
        ),
      ),
    ).toEqual([])
  })

  it('reads nothing inside a fenced code block', () => {
    expect(
      pageClaimRefs(
        page('Prose.\n\n```markdown\nA sample claim [S1].\n```\n\nMore prose.'),
      ),
    ).toEqual([])
  })

  it('reads nothing inside an inline code span', () => {
    // The first live run reported 50 uncited sources on [[topics/llm-wiki]],
    // whose prose describes this convention in backticks. A page documenting a
    // marker does not cite one.
    expect(
      pageClaimRefs(page('The scheme rewrites `[S1]` into `[S1](#sources)`.')),
    ).toEqual([])
  })
})
