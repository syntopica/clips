import { describe, expect, it } from 'vitest'
import { agyBulkGrader } from './agy-bulk-grader.ts'
import { agyFineGrader } from './agy-fine-grader.ts'
import { cursorGrader } from './cursor-grader.ts'
import { runCodexGrade } from './run-codex-grade.ts'
import { selectGradeRunner } from './select-grade-runner.ts'

describe('selectGradeRunner', () => {
  it('defaults to codex with Claude behind it, both fine tier', () => {
    // The default is built per call now, because it closes over the author, so
    // it is identified by not being any of the pins rather than by reference.
    const runner = selectGradeRunner(undefined, null)
    expect(runner).not.toBe(runCodexGrade)
    expect(runner).not.toBe(agyFineGrader)
    expect(runner).not.toBe(agyBulkGrader)
    expect(runner).not.toBe(cursorGrader)
  })

  it('accepts the default by name', () => {
    expect(selectGradeRunner('fallback', null)).not.toBe(runCodexGrade)
  })

  it('pins codex, which reads the files itself under a read-only sandbox', () => {
    expect(selectGradeRunner('codex', null)).toBe(runCodexGrade)
  })

  it('pins Claude through agy, the fine tier without codex', () => {
    expect(selectGradeRunner('agy-fine', null)).toBe(agyFineGrader)
  })

  it('pins cursor, the fourth account and the independent grader', () => {
    expect(selectGradeRunner('cursor', null)).toBe(cursorGrader)
  })

  it('allows grading on the bulk tier when every fine quota is gone', () => {
    // A graded page on a cheaper model still beats an ungraded one.
    expect(selectGradeRunner('agy-bulk', null)).toBe(agyBulkGrader)
  })

  it('lets a pin stand even when the author is that same model', () => {
    // Pinning is how the operator overrules the guard; the guard stands behind
    // the default, which is the case the operator did not choose.
    expect(selectGradeRunner('agy-fine', 'claude-opus-4-6-thinking')).toBe(
      agyFineGrader,
    )
  })

  it('throws on an unrecognised name rather than silently defaulting', () => {
    // Grading the wiki with a model the caller did not choose is the failure
    // this prevents; the two transports do not agree closely enough for the
    // substitution to be invisible.
    expect(() => selectGradeRunner('gemini-pro', null)).toThrow(
      /Unknown CLIPS_GRADE_RUNNER/,
    )
  })

  it('throws on an empty value', () => {
    expect(() => selectGradeRunner('', null)).toThrow(
      /Unknown CLIPS_GRADE_RUNNER/,
    )
  })
})
