import { describe, expect, it } from 'vitest'
import { agyBulkTriage } from './agy-bulk-triage.ts'
import { runTriageCodex } from './run-triage-codex.ts'
import { runTriageWithFallback } from './run-triage-with-fallback.ts'
import { selectTriageRunner } from './select-triage-runner.ts'

describe('selectTriageRunner', () => {
  it('defaults to Gemini through agy, the tier that survives a full corpus', () => {
    expect(selectTriageRunner(undefined)).toBe(agyBulkTriage)
  })

  it('still offers the pre-2026-08-02 default by name', () => {
    expect(selectTriageRunner('fallback')).toBe(runTriageWithFallback)
  })

  it('pins codex alone, so a failed batch degrades instead of switching', () => {
    expect(selectTriageRunner('codex')).toBe(runTriageCodex)
  })

  it('selects agy for the credit-outage case', () => {
    expect(selectTriageRunner('agy')).toBe(agyBulkTriage)
  })

  it('throws on an unrecognised name rather than silently defaulting', () => {
    // A typo must not quietly run the whole harvest on codex when the caller
    // asked for something else.
    expect(() => selectTriageRunner('agi')).toThrow(
      /Unknown CLIPS_TRIAGE_RUNNER/,
    )
  })

  it('throws on an empty value', () => {
    expect(() => selectTriageRunner('')).toThrow(/Unknown CLIPS_TRIAGE_RUNNER/)
  })
})
