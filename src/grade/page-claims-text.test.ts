import { describe, expect, it } from 'vitest'
import { pageClaimsText } from './page-claims-text.ts'

describe('pageClaimsText', () => {
  it('drops a trailing sources list', () => {
    const page = [
      '# Page',
      '',
      'A claim.',
      '',
      '## Sources',
      '',
      '- https://example.com (re-captured complete after the clip truncated)',
      '',
    ].join('\n')
    expect(pageClaimsText(page)).toBe('# Page\n\nA claim.\n')
  })

  it('keeps a section a later batch appended after the sources list', () => {
    // Three pages already have this shape, and what follows is ordinary prose.
    const page = [
      '# Page',
      '',
      '## Sources',
      '',
      '- https://example.com',
      '',
      '## Later section',
      '',
      'Another claim.',
    ].join('\n')
    expect(pageClaimsText(page)).toBe(
      '# Page\n\n## Later section\n\nAnother claim.',
    )
  })

  it('leaves a page with no sources list untouched', () => {
    // Most of business/ and personal/ is written from the owner's own
    // knowledge and cites nothing.
    const page = '# Page\n\nA claim.\n'
    expect(pageClaimsText(page)).toBe(page)
  })

  it('ignores a heading that only starts with the word', () => {
    const page = '## Sources of truth\n\nA claim.\n'
    expect(pageClaimsText(page)).toBe(page)
  })
})
