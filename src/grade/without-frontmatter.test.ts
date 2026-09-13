import { describe, expect, it } from 'vitest'
import { withoutFrontmatter } from './without-frontmatter.ts'

describe('withoutFrontmatter', () => {
  it('drops the frontmatter block and keeps the prose', () => {
    const page = [
      '---',
      'title: Page',
      'type: topic',
      'updated: 2026-08-03',
      '---',
      '',
      'A claim.',
      '',
    ].join('\n')
    expect(withoutFrontmatter(page)).toBe('\nA claim.\n')
  })

  it('drops the source urls the grader was reading as claims', () => {
    // The real finding: this slug came back as "17 official skills" and
    // "11 plugins for Cowork", neither of which the page body contains.
    const page = [
      '---',
      'title: Page',
      'sources:',
      '  - https://medium.com/@x/anthropic-ships-17-skills-for-code-and-11-plugins-for-cowork-c752d2ae5a20',
      '---',
      '',
      'A claim.',
    ].join('\n')
    expect(withoutFrontmatter(page)).not.toContain('17-skills-for-code')
    expect(withoutFrontmatter(page)).toContain('A claim.')
  })

  it('leaves a page with no frontmatter untouched', () => {
    const page = '# Page\n\nA claim.\n'
    expect(withoutFrontmatter(page)).toBe(page)
  })

  it('leaves a horizontal rule in prose alone', () => {
    // Only a block the file opens with counts, or a thematic break would eat
    // everything above the next one.
    const page = '# Page\n\n---\n\nA claim.\n'
    expect(withoutFrontmatter(page)).toBe(page)
  })

  it('leaves an unterminated block untouched rather than swallowing the page', () => {
    const page = '---\ntitle: Page\n\nA claim.\n'
    expect(withoutFrontmatter(page)).toBe(page)
  })
})
