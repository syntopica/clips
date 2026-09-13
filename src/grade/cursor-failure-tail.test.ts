import { describe, expect, it } from 'vitest'
import { cursorFailureTail } from './cursor-failure-tail.ts'

const run = (stdout: string, stderr: string) => ({
  stdout,
  stderr,
  failed: true,
})

describe('cursorFailureTail', () => {
  it('carries stdout, where cursor prints its own refusals', () => {
    // The reason this exists rather than reusing agyFailureTail: the commonest
    // misconfiguration writes to stdout and leaves stderr empty, so a tail
    // reading stderr alone reports it as no message at all.
    expect(cursorFailureTail(run('⚠ Workspace Trust Required', ''))).toMatch(
      /Workspace Trust Required/,
    )
  })

  it('puts stderr first, where a real crash lands', () => {
    expect(cursorFailureTail(run('noise', 'boom'))).toBe('boom | noise')
  })

  it('says so when the run produced nothing, rather than returning empty', () => {
    // The exact shape a 480 KB argv prompt produced before the prompt moved to
    // stdin: exit 0, no stdout, no stderr, nothing to diagnose.
    expect(cursorFailureTail(run('', ''))).toBe('cursor produced no output')
  })

  it('bounds the tail so a grade report stays readable', () => {
    expect(cursorFailureTail(run('', 'x'.repeat(5000)))).toHaveLength(400)
  })
})
