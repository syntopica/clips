import { describe, expect, it } from 'vitest'
import { AGY_FINE_MODEL } from '../models/agy-fine-model.ts'
import { agyBulkGrader } from './agy-bulk-grader.ts'
import { agyFineGrader } from './agy-fine-grader.ts'
import { cursorGrader } from './cursor-grader.ts'
import { runCodexGrade } from './run-codex-grade.ts'
import { selectGradeRunner } from './select-grade-runner.ts'

describe('selectGradeRunner', () => {
  it('builds the two-transport pass, codex with Claude behind it', () => {
    // It is built per call, because it closes over the author, so it is
    // identified by not being any of the pins rather than by reference.
    const runner = selectGradeRunner('fallback', null)
    expect(runner).not.toBe(runCodexGrade)
    expect(runner).not.toBe(agyFineGrader)
    expect(runner).not.toBe(agyBulkGrader)
    expect(runner).not.toBe(cursorGrader)
  })

  it('refuses to grade for an instance that configured no transport', () => {
    // Grading has no interactive floor the way synthesis does, so the honest
    // unconfigured answer is a stop carrying its own fix.
    expect(() => selectGradeRunner(null, null)).toThrow(/runners.grade/)
    expect(() => selectGradeRunner('manual', null)).toThrow(/runners.grade/)
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

  it('refuses a pin that is the tier which wrote the batch', () => {
    // The README promises the model that wrote a page may not grade it. The
    // pinned branches never looked at the author, so this returned the page's
    // own author with a report that read like a real verdict.
    expect(() => selectGradeRunner('agy-fine', AGY_FINE_MODEL)).toThrow(
      /author verifying/,
    )
  })

  it('accepts a pin on a tier that did not write the batch', () => {
    expect(selectGradeRunner('cursor', AGY_FINE_MODEL)).toBe(cursorGrader)
  })

  it('refuses a pin when the author is reported but unrecognised', () => {
    // An unknown transport may be any tier, so none can be ruled free.
    expect(() => selectGradeRunner('cursor', 'some-new-model')).toThrow(
      /author verifying/,
    )
  })

  it('throws on an unrecognised name rather than silently defaulting', () => {
    // Grading the wiki with a model the caller did not choose is the failure
    // this prevents; the two transports do not agree closely enough for the
    // substitution to be invisible.
    expect(() => selectGradeRunner('gemini-pro', null)).toThrow(
      /Unknown grade runner/,
    )
  })

  it('throws on an empty value', () => {
    expect(() => selectGradeRunner('', null)).toThrow(/Unknown grade runner/)
  })
})
