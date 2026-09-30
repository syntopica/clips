import { describe, expect, it } from 'vitest'
import { insertRelatedLink } from './insert-related-link.ts'

const NEW = 'topics/new'

describe('insertRelatedLink', () => {
  it('joins an existing Related list', () => {
    const page =
      '# A\n\nBody.\n\n## Related\n\n- [[topics/x]]\n\n## Detail\n\nMore.\n'
    expect(insertRelatedLink(page, NEW)).toBe(
      '# A\n\nBody.\n\n## Related\n\n- [[topics/x]]\n- [[topics/new]]\n\n## Detail\n\nMore.\n',
    )
  })

  it('joins a See also list at the end of the page', () => {
    const page = '# A\n\n## See also\n\n- [[topics/x]]\n\n'
    expect(insertRelatedLink(page, NEW)).toBe(
      '# A\n\n## See also\n\n- [[topics/x]]\n- [[topics/new]]\n',
    )
  })

  it('adds a line at the end of a page with no such section', () => {
    expect(insertRelatedLink('# A\n\nBody.\n', NEW)).toBe(
      '# A\n\nBody.\n\nSee also: [[topics/new]]\n',
    )
  })

  it('keeps a Contested section last', () => {
    const page = '# A\n\nBody.\n\n## Contested\n\n- 2026-09-01: old\n'
    expect(insertRelatedLink(page, NEW)).toBe(
      '# A\n\nBody.\n\nSee also: [[topics/new]]\n\n## Contested\n\n- 2026-09-01: old\n',
    )
  })

  it('leaves a page that already links there untouched', () => {
    const page = '# A\n\nSee [[topics/new]].\n'
    expect(insertRelatedLink(page, NEW)).toBe(page)
  })
})
