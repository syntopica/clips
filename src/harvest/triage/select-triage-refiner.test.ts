import { describe, expect, it } from 'vitest'
import { agyBulkTriage } from './agy-bulk-triage.ts'
import { agyFineTriage } from './agy-fine-triage.ts'
import { runRefineWithFallback } from './run-refine-with-fallback.ts'
import { runTriageCodex } from './run-triage-codex.ts'
import { selectTriageRefiner } from './select-triage-refiner.ts'

describe('selectTriageRefiner', () => {
  it('defaults to codex with Claude behind it, both fine tier', () => {
    expect(selectTriageRefiner(undefined)).toBe(runRefineWithFallback)
  })

  it('accepts the default by name', () => {
    expect(selectTriageRefiner('fallback')).toBe(runRefineWithFallback)
  })

  it('pins codex, which degrades rather than switching model', () => {
    expect(selectTriageRefiner('codex')).toBe(runTriageCodex)
  })

  it('pins Claude through agy, the fine tier without codex', () => {
    expect(selectTriageRefiner('agy-fine')).toBe(agyFineTriage)
  })

  it('allows refining on the bulk tier when every fine quota is gone', () => {
    // Barely a second opinion - it is the model that produced the first - but
    // a weak second pass beats none.
    expect(selectTriageRefiner('agy-bulk')).toBe(agyBulkTriage)
  })

  it('returns null for off, leaving the bulk pass alone', () => {
    expect(selectTriageRefiner('off')).toBeNull()
  })

  it('throws on an unrecognised name rather than dropping the pass', () => {
    // Defaulting a typo to null would silently return the harvest to one pass,
    // which reads as "the refiner agreed with everything".
    expect(() => selectTriageRefiner('none')).toThrow(
      /Unknown CLIPS_TRIAGE_REFINER/,
    )
  })

  it('throws on an empty value', () => {
    expect(() => selectTriageRefiner('')).toThrow(
      /Unknown CLIPS_TRIAGE_REFINER/,
    )
  })
})
