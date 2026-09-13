import { describe, expect, it } from 'vitest'
import { splitNul } from './split-nul.ts'

describe('splitNul', () => {
  it('drops the trailing empty entry git always emits', () => {
    expect(splitNul('a\u0000b\u0000')).toEqual(['a', 'b'])
  })

  it('returns nothing for empty output', () => {
    expect(splitNul('')).toEqual([])
  })

  it('keeps a filename containing a newline', () => {
    // This is the entire reason for -z. A line-based split corrupts it.
    expect(splitNul('we\nird.md\u0000')).toEqual(['we\nird.md'])
  })
})
