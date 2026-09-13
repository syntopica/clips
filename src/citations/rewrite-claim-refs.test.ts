import { describe, expect, it } from 'vitest'
import { rewriteClaimRefs } from './rewrite-claim-refs.ts'

const page = (body: string): string =>
  `---
title: T
sources:
  - https://a.example/why-[S1]-matters
---

${body}
`

describe('rewriteClaimRefs', () => {
  it('turns a bare marker into a link into the page sources section', () => {
    expect(rewriteClaimRefs(page('A claim [S1]. Mine [OWN].'))).toBe(
      page('A claim [[S1]](#sources). Mine [[OWN]](#sources).'),
    )
  })

  it('leaves an already rewritten marker alone', () => {
    // The pass runs on every ingest, and a page can be edited by several.
    const once = rewriteClaimRefs(page('A claim [S1].'))
    expect(rewriteClaimRefs(once)).toBe(once)
  })

  it('leaves the frontmatter block untouched', () => {
    expect(rewriteClaimRefs(page('No markers here.'))).toBe(
      page('No markers here.'),
    )
  })

  it('leaves the ## Sources section untouched', () => {
    const body = 'A claim [S1].\n\n## Sources\n\n- [S1] https://a.example/'
    expect(rewriteClaimRefs(page(body))).toBe(
      page(
        'A claim [[S1]](#sources).\n\n## Sources\n\n- [S1] https://a.example/',
      ),
    )
  })

  it('resumes rewriting after the sources section ends', () => {
    const body =
      'One [S1].\n\n## Sources\n\n- [S1] url\n\n## Notes\n\nTwo [S1].'
    expect(rewriteClaimRefs(page(body))).toBe(
      page(
        'One [[S1]](#sources).\n\n## Sources\n\n- [S1] url\n\n## Notes\n\nTwo [[S1]](#sources).',
      ),
    )
  })

  it('leaves a fenced code block untouched', () => {
    const body = 'Prose [S1].\n\n```markdown\nA sample [S1].\n```'
    expect(rewriteClaimRefs(page(body))).toBe(
      page('Prose [[S1]](#sources).\n\n```markdown\nA sample [S1].\n```'),
    )
  })

  it('leaves an inline code span untouched', () => {
    expect(
      rewriteClaimRefs(page('The scheme writes `[S1]` for the first.')),
    ).toBe(page('The scheme writes `[S1]` for the first.'))
  })

  it('leaves a page with no markers byte-identical', () => {
    const untouched = page('Prose written before the scheme existed.')
    expect(rewriteClaimRefs(untouched)).toBe(untouched)
  })
})
