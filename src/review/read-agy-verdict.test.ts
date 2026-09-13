import { describe, expect, it } from 'vitest'
import { readAgyVerdict } from './read-agy-verdict.ts'

describe('readAgyVerdict', () => {
  it('applies only on an explicit apply', () => {
    expect(readAgyVerdict('{"verdict":"apply","reason":""}')).toEqual({
      verdict: 'apply',
      reason: '',
    })
  })

  it('keeps a skip reason so the next synthesis is told what was wrong', () => {
    expect(
      readAgyVerdict('{"verdict":"skip","reason":"claim not in the source"}'),
    ).toEqual({ verdict: 'skip', reason: 'claim not in the source' })
  })

  it('escalates an empty body rather than reading it as a verdict', () => {
    // agy exits 0 with an empty body on a spent quota. Counting that as a
    // verdict is how a batch gets marked done having examined nothing.
    expect(readAgyVerdict('').verdict).toBe('claude')
    expect(readAgyVerdict(null).verdict).toBe('claude')
  })

  it('escalates anything unparseable or unrecognised', () => {
    expect(readAgyVerdict('not json').verdict).toBe('claude')
    expect(readAgyVerdict('"a string"').verdict).toBe('claude')
    expect(readAgyVerdict('{"verdict":"APPLY"}').verdict).toBe('claude')
    expect(readAgyVerdict('{"verdict":"quit"}').verdict).toBe('claude')
  })
})
