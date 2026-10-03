import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { GitResult } from './git-result.ts'

/** `runGit` with a body on stdin, for the batch commands (`cat-file
 * --batch-check`) that answer many questions from one process. Never throws on
 * a non-zero exit, for the same reason `runGit` does not. */
export const runGitWithInput = async (
  repository: string,
  args: string[],
  input: string,
): Promise<GitResult> => {
  const running = promisify(execFile)('git', ['-C', repository, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, LC_ALL: 'C' },
  })
  running.child.stdin?.end(input)
  try {
    const { stdout, stderr } = await running
    return { stdout, stderr, exitCode: 0 }
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; code?: number }
    return {
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
      exitCode: typeof failure.code === 'number' ? failure.code : 1,
    }
  }
}
