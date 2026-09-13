import { describe, expect, it } from 'vitest'
import { pageVerificationExempt } from './page-verification-exempt.ts'

const withFrontmatter = (...lines: string[]): string =>
  ['---', 'title: A page', ...lines, '---', '', 'Body.'].join('\n')

describe('pageVerificationExempt', () => {
  it('reads the marker', () => {
    expect(
      pageVerificationExempt(withFrontmatter('verification: exempt')),
    ).toBe(true)
  })

  it('is false when the field is absent', () => {
    expect(pageVerificationExempt(withFrontmatter('type: topic'))).toBe(false)
  })

  it('accepts only the one value, so a typo does not exempt a page', () => {
    expect(
      pageVerificationExempt(withFrontmatter('verification: exempted')),
    ).toBe(false)
    expect(pageVerificationExempt(withFrontmatter('verification: none'))).toBe(
      false,
    )
  })

  it('ignores the body, where the word is prose', () => {
    expect(
      pageVerificationExempt(
        `${withFrontmatter('type: topic')}\n\nverification: exempt\n`,
      ),
    ).toBe(false)
  })

  it('is false for a page with no frontmatter at all', () => {
    expect(pageVerificationExempt('# Just a heading\n')).toBe(false)
  })
})
