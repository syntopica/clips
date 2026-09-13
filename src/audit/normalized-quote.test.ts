import { describe, expect, it } from 'vitest'
import { normalizedQuote } from './normalized-quote.ts'

describe('normalizedQuote', () => {
  it('folds case, whitespace runs and line breaks', () => {
    expect(normalizedQuote('  The Model\n  reads   back ')).toBe(
      'the model reads back',
    )
  })

  it('folds the typography a publisher and this repository spell differently', () => {
    expect(normalizedQuote('it’s — a “quote”…')).toBe('it\'s - a "quote"...')
  })

  it('leaves the words alone, which is what the check is for', () => {
    expect(normalizedQuote('the model reads back')).not.toBe(
      normalizedQuote('the model reads it back'),
    )
  })
})
