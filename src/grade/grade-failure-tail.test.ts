import { describe, expect, it } from 'vitest'
import { gradeFailureTail } from './grade-failure-tail.ts'

describe('gradeFailureTail', () => {
  it('names the timeout kill before the stderr fragment', () => {
    const tail = gradeFailureTail(
      {
        killed: true,
        signal: 'SIGKILL',
        stderr: 'OKF = Context\n```\n',
      },
      600_000,
    )

    // The fragment underneath is a piece of whatever clip the grader was
    // reading when it died, and on its own it reads like a broken source.
    expect(tail.startsWith('killed after 10 minutes (SIGKILL)')).toBe(true)
    expect(tail).toContain('evidence set is probably too large')
    expect(tail).toContain('OKF = Context')
  })

  it('leaves a genuine failure as its stderr alone', () => {
    expect(gradeFailureTail({ stderr: 'codex: no such model' }, 600_000)).toBe(
      'codex: no such model',
    )
  })

  it('names the credit wall, which is not a fault of the page', () => {
    const tail = gradeFailureTail(
      {
        stderr:
          'ERROR: Your workspace is out of credits. Ask your workspace owner to refill in order to continue.',
      },
      600_000,
    )

    expect(tail.startsWith('the codex workspace is out of credits')).toBe(true)
  })

  it('reports the timeout it was actually given, not a constant', () => {
    expect(
      gradeFailureTail({ killed: true, signal: 'SIGKILL' }, 2_400_000),
    ).toContain('killed after 40 minutes')
  })

  it('survives a kill with no signal and no stderr', () => {
    expect(gradeFailureTail({ killed: true }, 600_000)).toContain('no signal')
  })
})
