import { describe, expect, it } from 'vitest'
import { pageUnclosedMathsBlock } from './page-unclosed-maths-block.ts'

describe('pageUnclosedMathsBlock', () => {
  it('reports the count when a block never closes', () => {
    // GitHub renders everything below an unclosed `$$` as a formula, so the
    // damage starts below where the mistake is.
    const page = ['$$', 'p = \\frac{hits}{total}', '', 'More prose.'].join('\n')
    expect(pageUnclosedMathsBlock(page)).toBe(1)
  })

  it('passes a closed block', () => {
    const page = ['$$', 'p = \\frac{hits}{total}', '$$', ''].join('\n')
    expect(pageUnclosedMathsBlock(page)).toBeNull()
  })

  it('counts both delimiters of a one-line block', () => {
    expect(pageUnclosedMathsBlock('$$p = a + b$$\n')).toBeNull()
  })

  it('ignores `$$` inside a fenced code block', () => {
    const page = ['```sh', 'echo "$$"', '```', ''].join('\n')
    expect(pageUnclosedMathsBlock(page)).toBeNull()
  })

  it('ignores `$$` inside an inline code span', () => {
    // The first live run flagged topics/web-platform.md whole, on the DevTools
    // console shorthand `$$()`.
    expect(
      pageUnclosedMathsBlock('`$()` and `$$()` as querySelector shorthands.\n'),
    ).toBeNull()
  })

  it('passes a page full of prices, which carry no `$$` at all', () => {
    expect(
      pageUnclosedMathsBlock('Sold for $4,000, resold for $12,500.\n'),
    ).toBeNull()
  })
})
