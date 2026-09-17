import { describe, expect, it } from 'vitest'
import { selectSynthesisTransport } from './select-synthesis-transport.ts'

describe('selectSynthesisTransport', () => {
  it('accepts every transport by name', () => {
    for (const name of ['agy-fine', 'agy-bulk', 'codex', 'cursor', 'fallback'])
      expect(selectSynthesisTransport(name)).toBeDefined()
  })

  it('throws on an unrecognised name rather than defaulting', () => {
    expect(() => selectSynthesisTransport('gemini')).toThrow(
      /Unknown synthesis runner "gemini"/,
    )
  })

  it('has no unconfigured case, because the caller answers it first', () => {
    // `selectSynthesizer` returns the interactive synthesizer for an unset or
    // manual `runners.synthesis`; reaching here with either is a caller bug,
    // not a request for agy.
    expect(() => selectSynthesisTransport('manual')).toThrow(
      /Unknown synthesis runner "manual"/,
    )
  })
})
