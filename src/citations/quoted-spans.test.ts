import { describe, expect, it } from 'vitest'
import { quotedSpans } from './quoted-spans.ts'

describe('quotedSpans', () => {
  it('returns a long enough quotation with the offset of its closing quote', () => {
    const line = 'The paper says "the model reads its own output back" here.'

    expect(quotedSpans(line)).toEqual([
      [52, 'the model reads its own output back'],
    ])
  })

  it('reads a curly pair, because a copied span carries the publisher typography', () => {
    expect(quotedSpans('It said “one two three four five six”.')).toEqual([
      [37, 'one two three four five six'],
    ])
  })

  it('drops a span shorter than the word floor, which is most of the corpus', () => {
    expect(quotedSpans('The flag is "workspace-write" by default.')).toEqual([])
  })

  it('returns both quotations on a line, in order', () => {
    expect(
      quotedSpans('First "one two three four five six" then "a b c d e f".'),
    ).toEqual([
      [35, 'one two three four five six'],
      [54, 'a b c d e f'],
    ])
  })
})
