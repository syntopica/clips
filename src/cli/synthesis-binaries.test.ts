import { describe, expect, it } from 'vitest'
import { SYNTHESIS_BINARIES } from './synthesis-binaries.ts'

describe('SYNTHESIS_BINARIES', () => {
  it('probes cursor-agent for the cursor transport', () => {
    // The ternary this replaced read `name === 'codex' ? 'codex' : 'agy'`, so a
    // cursor run probed agy and could announce `agy not available` while
    // cursor-agent was installed and working.
    expect(SYNTHESIS_BINARIES['cursor']).toBe('cursor-agent')
  })

  it('keeps codex and every agy spelling on their own binaries', () => {
    expect(SYNTHESIS_BINARIES['codex']).toBe('codex')
    expect(SYNTHESIS_BINARIES['agy-fine']).toBe('agy')
    expect(SYNTHESIS_BINARIES['agy-bulk']).toBe('agy')
    expect(SYNTHESIS_BINARIES['fallback']).toBe('agy')
  })

  it('covers every name selectSynthesisTransport accepts', () => {
    // A transport missing here falls through to agy, which is the old defect
    // rather than a safe default.
    for (const name of [
      'codex',
      'cursor',
      'agy-fine',
      'agy-bulk',
      'agy',
      'fallback',
    ])
      expect(SYNTHESIS_BINARIES[name]).toBeDefined()
  })
})
