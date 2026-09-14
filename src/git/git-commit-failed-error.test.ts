import { describe, expect, it } from 'vitest'
import { GitCommitFailedError } from './git-commit-failed-error.ts'
import { GitFailedError } from './git-failed-error.ts'

describe('GitCommitFailedError', () => {
  it('preserves the attempted message, exit code and both output streams', () => {
    const message = 'chore(clips): move a clip\n\nFailure: TEST_FAILURE'
    const error = new GitCommitFailedError('temporary-repository', message, {
      stdout: 'hook output\n',
      stderr: 'hook refusal\n',
      exitCode: 1,
    })
    expect(error).toBeInstanceOf(GitFailedError)
    expect(error.exitCode).toBe(1)
    expect(error.args).toEqual(['commit', '-q', '-m', message])
    expect(error.stderr).toBe('hook refusal\n')
    expect(error.message).toContain(message)
    expect(error.message).toContain('hook output\nhook refusal')
    expect(error.message).toContain('temporary-repository')
    expect(error.message).toContain('staged but uncommitted')
  })
})
