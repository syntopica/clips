import { describe, expect, it } from 'vitest'
import { pageInlineMaths } from './page-inline-maths.ts'

describe('pageInlineMaths', () => {
  it('reports a `$…$` span carrying a LaTeX command', () => {
    expect(pageInlineMaths('The cost is $n \\times k$ per run.\n')).toEqual([
      'line 1: The cost is $n \\times k$ per run.',
    ])
  })

  it('leaves two prices in one paragraph alone', () => {
    // 349 dollar amounts across 36 pages: a plain `$…$` check would report
    // every one of them and be switched off inside a batch.
    expect(
      pageInlineMaths('Sold for $4,000 and resold for $12,500 a year later.\n'),
    ).toEqual([])
  })

  it('leaves a `$$` block alone, which is the allowed form', () => {
    const page = ['$$', 'p = \\frac{hits}{total}', '$$', ''].join('\n')
    expect(pageInlineMaths(page)).toEqual([])
  })

  it('leaves a whole formula written on one `$$` line alone', () => {
    expect(pageInlineMaths('$$p = \\frac{hits}{total}$$\n')).toEqual([])
  })

  it('leaves a fenced code block alone', () => {
    // A shell snippet is full of `$VAR`, and LaTeX quoted in a fence is
    // documentation of the convention rather than a breach of it.
    const page = ['```md', '$n \\times k$', '```', ''].join('\n')
    expect(pageInlineMaths(page)).toEqual([])
  })

  it('leaves an inline code span alone', () => {
    // SCHEMA's own advice is to write a formula in a sentence as code.
    expect(
      pageInlineMaths('Cost is `$n \\times k$` per run, written as code.\n'),
    ).toEqual([])
  })

  it('reports the line number, so the finding can be jumped to', () => {
    const page = ['# Page', '', 'Ratio $x \\text{ per } y$ holds.', ''].join(
      '\n',
    )
    expect(pageInlineMaths(page)).toEqual([
      'line 3: Ratio $x \\text{ per } y$ holds.',
    ])
  })
})
