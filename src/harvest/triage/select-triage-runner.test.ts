import { describe, expect, it } from 'vitest'
import { agyBulkTriage } from './agy-bulk-triage.ts'
import { runTriageCodex } from './run-triage-codex.ts'
import { runTriageWithFallback } from './run-triage-with-fallback.ts'
import { selectTriageRunner } from './select-triage-runner.ts'

describe('selectTriageRunner', () => {
  it('refuses to pick a transport for an instance that configured none', () => {
    // No interactive classifier exists, and the stage reads every harvested
    // title: choosing agy here spent an unconfigured owner's quota on a model
    // they had never named.
    expect(() => selectTriageRunner(null)).toThrow(/runners.triage/)
    expect(() => selectTriageRunner('manual')).toThrow(/runners.triage/)
  })

  it('still offers the pre-2026-08-02 default by name', () => {
    expect(selectTriageRunner('fallback')).toBe(runTriageWithFallback)
  })

  it('pins codex alone, so a failed batch degrades instead of switching', () => {
    expect(selectTriageRunner('codex')).toBe(runTriageCodex)
  })

  it('selects the bulk tier, which survives a full corpus', () => {
    expect(selectTriageRunner('agy-bulk')).toBe(agyBulkTriage)
  })

  it('throws on an unrecognised name rather than silently defaulting', () => {
    // A typo must not quietly run the whole harvest on codex when the caller
    // asked for something else.
    expect(() => selectTriageRunner('agi')).toThrow(/Unknown triage runner/)
  })

  it('throws on an empty value', () => {
    expect(() => selectTriageRunner('')).toThrow(/Unknown triage runner/)
  })
})
