import { describe, expect, it } from 'vitest'
import { pageQuotedClaims } from './page-quoted-claims.ts'

const page = (body: string): string =>
  `---
title: T
sources:
  - https://a.example/
  - SCHEMA.md
---

${body}
`

describe('pageQuotedClaims', () => {
  it('attributes a quotation to the marker that follows it', () => {
    expect(
      pageQuotedClaims(page('It reads "one two three four five six" [S1].')),
    ).toEqual([{ quote: 'one two three four five six', ref: 'S1' }])
  })

  it('attributes each quotation on a line to its own marker', () => {
    expect(
      pageQuotedClaims(
        page(
          'It reads "one two three four five six" [S1], and "a b c d e f" [S2].',
        ),
      ),
    ).toEqual([
      { quote: 'one two three four five six', ref: 'S1' },
      { quote: 'a b c d e f', ref: 'S2' },
    ])
  })

  it('drops a quotation no marker follows rather than guessing its source', () => {
    expect(
      pageQuotedClaims(
        page('A claim [S1], then "one two three four five six".'),
      ),
    ).toEqual([])
  })

  it('reads the rewritten marker form as well as the bare one', () => {
    expect(
      pageQuotedClaims(
        page('It reads "one two three four five six" [[S2]](#sources).'),
      ),
    ).toEqual([{ quote: 'one two three four five six', ref: 'S2' }])
  })

  it('ignores a fenced block, a code span and the sources section', () => {
    expect(
      pageQuotedClaims(
        page(
          [
            '```',
            'echo "one two three four five six" [S1]',
            '```',
            '',
            'The convention is `"one two three four five six" [S1]`.',
            '',
            '## Sources',
            '',
            '- "one two three four five six" [S1]',
          ].join('\n'),
        ),
      ),
    ).toEqual([])
  })
})
