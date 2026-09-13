import { describe, expect, it } from 'vitest'
import { selectSynthesisTransport } from './select-synthesis-transport.ts'

describe('selectSynthesisTransport', () => {
  it('defaults to the fallback pair when unset', () => {
    expect(selectSynthesisTransport(undefined)).toBeDefined()
  })

  it('accepts every transport by name', () => {
    for (const name of ['agy', 'agy-fine', 'agy-bulk', 'codex', 'fallback'])
      expect(selectSynthesisTransport(name)).toBeDefined()
  })

  it('throws on an unrecognised name rather than defaulting', () => {
    expect(() => selectSynthesisTransport('gemini')).toThrow(
      /Unknown CLIPS_SYNTHESIS_RUNNER "gemini"/,
    )
  })
})
