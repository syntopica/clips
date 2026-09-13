import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'

/** Changed lines per path, tracked changes via `diff --numstat` against HEAD
 * and untracked files counted whole - numstat cannot see them, and an
 * uncounted new page would make the total-lines limit a fiction. */
export const changedLineCounts = async (
  worktree: string,
  paths: string[],
  untracked: Set<string>,
): Promise<Map<string, number>> => {
  const counts = new Map<string, number>()
  const tracked = paths.filter((path) => !untracked.has(path))
  if (tracked.length > 0) {
    const args = ['diff', '--numstat', 'HEAD', '--', ...tracked]
    const result = await runGit(worktree, args)
    if (result.exitCode !== 0)
      throw new GitFailedError(args, result.exitCode, result.stderr)
    for (const line of result.stdout.split('\n').filter(Boolean)) {
      const [added, deleted, path] = line.split('\t')
      counts.set(
        path ?? '',
        Number(added === '-' ? 0 : added) +
          Number(deleted === '-' ? 0 : deleted),
      )
    }
  }
  for (const path of paths.filter((entry) => untracked.has(entry))) {
    const text = await readFile(join(worktree, path), 'utf8')
    counts.set(path, text.split('\n').length)
  }
  return counts
}
