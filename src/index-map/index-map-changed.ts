import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import { splitNul } from '../git/split-nul.ts'
import { indexRepositoryPath } from '../layout/index-repository-path.ts'

/** Whether regenerating the map actually changed it. A clip that only updates
 * existing pages leaves the index byte-identical, and staging an unchanged
 * path would make the committer's staged-equals-validated check disagree with
 * itself (`commitWikiAndLedger`). So the path joins the validated set only when
 * there is something in it to commit. */
export const indexMapChanged = async (worktree: string): Promise<boolean> => {
  const args = ['status', '--porcelain=v2', '-z', '--', indexRepositoryPath()]
  const result = await runGit(worktree, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
  return splitNul(result.stdout).length > 0
}
