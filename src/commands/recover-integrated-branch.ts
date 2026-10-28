import { refExists } from '../git/ref-exists.ts'
import { deleteBranch } from '../publish/delete-branch.ts'
import { ingestDraftRef } from '../publish/ingest-draft-ref.ts'
import { removeIngestWorktree } from '../publish/remove-ingest-worktree.ts'
import { worktreeForBranch } from '../publish/worktree-for-branch.ts'

/** The recovery report line for an ingest branch already contained in
 * origin/main: cleaned up, unless a saved draft says the branch is the marker
 * an operator has to clear. A draft means the worktree held refused synthesis
 * and was removed only to free its checkout. */
export const recoverIntegratedBranch = async (
  brainRepository: string,
  branch: string,
  clipId: string,
): Promise<string> => {
  const draft = ingestDraftRef(clipId)
  if (await refExists(brainRepository, draft))
    return `${branch}: kept with ${draft} for an operator`
  const worktree = await worktreeForBranch(brainRepository, branch)
  const kept =
    worktree === null
      ? await deleteBranch(brainRepository, branch)
      : await removeIngestWorktree(brainRepository, clipId, worktree)
  return kept === null
    ? `recovered ${branch}: already integrated, cleaned up`
    : `recovered ${branch}: already integrated, kept ${kept}`
}
