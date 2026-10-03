import { runGitWithInput } from '../git/run-git-with-input.ts'
import { isBatchResolvableCommit } from './is-batch-resolvable-commit.ts'
import { RESOLVED_COMMIT_LINE } from './resolved-commit-line.ts'

/** Every recorded brainCommit resolved by one `git cat-file --batch-check`
 * instead of one `rev-parse` each. Measured on a 2043-clip store: 1402
 * processed clips meant 1402 subprocesses and 9 s of a 14 s `clips status`.
 *
 * Only commits that resolve are returned. A missing or ambiguous one is left
 * out, so the caller falls back to `resolveBrainCommit` and reports it with
 * exactly the reason it always has; this map can make a run faster but never
 * changes what a clip is reported as. */
export const resolveCommitsInBatch = async (
  brainRepository: string,
  brainCommits: readonly string[],
): Promise<ReadonlyMap<string, string>> => {
  const unique = [...new Set(brainCommits)].filter(isBatchResolvableCommit)
  const resolved = new Map<string, string>()
  if (unique.length === 0) return resolved
  const result = await runGitWithInput(
    brainRepository,
    ['cat-file', '--batch-check'],
    unique.map((commit) => `${commit}^{commit}\n`).join(''),
  )
  if (result.exitCode !== 0) return resolved
  const lines = result.stdout.split('\n')
  for (const [index, commit] of unique.entries()) {
    const sha = RESOLVED_COMMIT_LINE.exec(lines[index] ?? '')?.[1]
    if (sha !== undefined) resolved.set(commit, sha)
  }
  return resolved
}
