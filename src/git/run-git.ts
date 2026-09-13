import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { GitResult } from './git-result.ts'

/** Never throws on a non-zero exit: several callers read the exit code as the
 * answer (merge-base --is-ancestor is the clearest). Callers that need a
 * failure to be fatal raise GitFailedError themselves. */
export const runGit = async (
  repository: string,
  args: string[],
): Promise<GitResult> => {
  const execFileAsync = promisify(execFile)
  try {
    const { stdout, stderr } = await execFileAsync(
      'git',
      ['-C', repository, ...args],
      {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        // Callers (resolveCommit) match English substrings in stderr. Without
        // this, a non-English locale on the host silently breaks that match.
        env: { ...process.env, LC_ALL: 'C' },
      },
    )
    return { stdout, stderr, exitCode: 0 }
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; code?: number }
    return {
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
      exitCode: failure.code ?? 1,
    }
  }
}
