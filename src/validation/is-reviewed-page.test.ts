import { describe, expect, it } from 'vitest'
import { isReviewedPage } from './is-reviewed-page.ts'

const page = (frontmatter: string): string =>
  `---\ntitle: Toolkit\ntype: project\n${frontmatter}updated: 2026-08-02\nsources:\n  - https://example.invalid/a\n---\n\n# Toolkit\n`

describe('isReviewedPage', () => {
  it('finds the marker anywhere in the frontmatter', () => {
    expect(isReviewedPage(page('reviewed: true\n'))).toBe(true)
  })

  it('ignores an explicit false', () => {
    expect(isReviewedPage(page('reviewed: false\n'))).toBe(false)
  })

  it('treats an unmarked page as unprotected', () => {
    expect(isReviewedPage(page(''))).toBe(false)
  })

  it('ignores the marker in the body, where it is prose', () => {
    expect(isReviewedPage(`${page('')}\nreviewed: true\n`)).toBe(false)
  })

  it('treats a page with no frontmatter as unprotected', () => {
    expect(isReviewedPage('# Toolkit\n\nreviewed: true\n')).toBe(false)
  })

  it('treats unterminated frontmatter as unprotected', () => {
    expect(isReviewedPage('---\ntitle: Toolkit\nreviewed: true\n')).toBe(false)
  })
})
