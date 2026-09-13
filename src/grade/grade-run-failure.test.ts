import { describe, expect, it } from 'vitest'
import { gradeRunFailure } from './grade-run-failure.ts'

describe('gradeRunFailure', () => {
  it('reports the exit code and the tail when the process failed', () => {
    expect(
      gradeRunFailure({
        exitCode: 1,
        lastMessage: null,
        stderrTail: 'Individual quota reached',
      }),
    ).toBe('grader exited 1: Individual quota reached')
  })

  it('carries the tail when the process succeeded but said nothing readable', () => {
    // The defect this test pins: for three weeks every unparseable success
    // printed the bare sentence, so a refusal envelope, prose where JSON was
    // asked for, and a quota wall were indistinguishable in the report.
    expect(
      gradeRunFailure({
        exitCode: 0,
        lastMessage: null,
        stderrTail: '{"is_error":true,"result":"I cannot do that"}',
      }),
    ).toMatch(/no readable verdict: .*is_error/)
  })

  it('prints the bare sentence when there is genuinely nothing to show', () => {
    // codex reports success with an empty stderr, so a colon here would be
    // punctuation standing in for evidence.
    expect(
      gradeRunFailure({ exitCode: 0, lastMessage: null, stderrTail: '' }),
    ).toBe('grader returned no readable verdict')
  })
})
