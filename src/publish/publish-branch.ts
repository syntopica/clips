import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import { ingestBranchName } from './ingest-branch-name.ts'

/** SPEC:399-414: push ingest/<clip_id> to main; on rejection fetch, rebuild
 * the branch on the new origin/main by cherry-picking the wiki+ledger commit
 * in the ingest worktree, and retry exactly once. The changed sha is harmless
 * because the ledger never stores its own commit. A clean cherry-pick carries
 * exactly the validated diff; a conflicting one is aborted, the original
 * commit is preserved on ingest/<clip_id>-orig, and the run stops. Returns
 * the sha origin/main now carries. */
export const publishBranch = async (
  brainRepository: string,
  worktree: string,
  clipId: string,
  commitSha: string,
): Promise<string> => {
  const branch = ingestBranchName(clipId)
  const push = async (): ReturnType<typeof runGit> =>
    runGit(brainRepository, ['push', 'origin', `${branch}:main`])

  const first = await push()
  if (first.exitCode === 0) return commitSha

  await runGit(brainRepository, ['fetch', 'origin'])
  const keep = await runGit(brainRepository, [
    'branch',
    `${branch}-orig`,
    commitSha,
  ])
  if (keep.exitCode !== 0)
    throw new GitFailedError(['branch'], keep.exitCode, keep.stderr)
  const reset = await runGit(worktree, ['reset', '--hard', 'origin/main'])
  if (reset.exitCode !== 0)
    throw new GitFailedError(['reset'], reset.exitCode, reset.stderr)
  const pick = await runGit(worktree, ['cherry-pick', commitSha])
  if (pick.exitCode !== 0) {
    await runGit(worktree, ['cherry-pick', '--abort'])
    throw new Error(
      `push of ${branch} was rejected and the cherry-pick onto the new origin/main conflicts; ` +
        `the original commit is kept on ${branch}-orig`,
    )
  }
  const second = await push()
  if (second.exitCode !== 0) {
    throw new Error(
      `push of ${branch} was rejected twice; both ${branch} and ${branch}-orig are kept. ${second.stderr.trim()}`,
    )
  }
  await runGit(brainRepository, ['branch', '-D', `${branch}-orig`])
  const sha = await runGit(worktree, ['rev-parse', 'HEAD'])
  return sha.stdout.trim()
}
