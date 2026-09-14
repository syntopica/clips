import { GitFailedError } from './git-failed-error.ts'
import type { GitResult } from './git-result.ts'

export class GitCommitFailedError extends GitFailedError {
  constructor(repository: string, message: string, result: GitResult) {
    super(['commit', '-q', '-m', message], result.exitCode, result.stderr)
    this.name = 'GitCommitFailedError'
    this.message =
      `git commit exited ${String(result.exitCode)} in ${repository}\n` +
      `Attempted commit message:\n${message}\n` +
      `Git/hook refusal:\n${result.stdout}${result.stderr}\n` +
      'Changes, including any clip move, are staged but uncommitted; ' +
      'inspect the index and resolve the refusal before retrying'
  }
}
