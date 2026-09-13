import { isAncestor } from '../git/is-ancestor.ts'
import { listBranches } from '../git/list-branches.ts'
import { resolveCommit } from '../git/resolve-commit.ts'
import { runGit } from '../git/run-git.ts'
import { deleteBranch } from '../publish/delete-branch.ts'
import { removeIngestWorktree } from '../publish/remove-ingest-worktree.ts'
import { worktreeForBranch } from '../publish/worktree-for-branch.ts'

/** SPEC:296-303: an ingest/<clip_id> branch is a recovery journal, not
 * residue, and no model runs during recovery. Already-integrated branches are
 * cleaned up; a branch ahead of origin/main resumes publication by pushing the
 * work that was already reviewed and committed; a diverged branch is reported
 * and left alone. Returns report lines. */
export const recoverIngestBranches = async (
  brainRepository: string,
): Promise<string[]> => {
  const report: string[] = []
  for (const branch of await listBranches(brainRepository, 'ingest/')) {
    const clipId = branch.slice('ingest/'.length)
    const tip = await resolveCommit(brainRepository, branch)
    if (await isAncestor(brainRepository, tip, 'origin/main')) {
      const worktree = await worktreeForBranch(brainRepository, branch)
      const kept =
        worktree === null
          ? await deleteBranch(brainRepository, branch)
          : await removeIngestWorktree(brainRepository, clipId, worktree)
      report.push(
        kept === null
          ? `recovered ${branch}: already integrated, cleaned up`
          : `recovered ${branch}: already integrated, kept ${kept}`,
      )
      continue
    }
    if (await isAncestor(brainRepository, 'origin/main', tip)) {
      const push = await runGit(brainRepository, [
        'push',
        'origin',
        `${branch}:main`,
      ])
      report.push(
        push.exitCode === 0
          ? `recovered ${branch}: publication resumed`
          : `${branch}: publication retry failed, run ingest again (${push.stderr.trim()})`,
      )
      continue
    }
    report.push(`${branch}: diverged from origin/main, resolve by hand`)
  }
  return report
}
