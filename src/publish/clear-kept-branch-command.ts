import { ingestDraftRef } from './ingest-draft-ref.ts'

/** The command that clears an `ingest/<clip_id>` branch a previous run kept,
 * with the draft saveIngestDraft recorded for it (`update-ref -d` on a ref
 * that is not there exits 0, so the chain holds when there is none).
 *
 * `removeIngestWorktree` is deliberately unforced, so a worktree holding
 * uncommitted synthesis survives a skip and takes its branch with it. That is
 * the recovery behaviour SPEC:435-436 asks for, and the cost is that clearing
 * it needs `--force` and `-D`: the operator is being told to discard work, so
 * the command says so rather than pretending a plain `git branch -d` would do
 * it.
 *
 * The worktree removal comes first because git refuses to delete a branch that
 * is still checked out somewhere. Chained with `&&` so a failed removal does
 * not leave a branch pointing at a worktree that is gone. */
export const clearKeptBranchCommand = (
  brainRepository: string,
  branch: string,
  worktree: string | null,
): string => {
  const draft = ingestDraftRef(branch.slice('ingest/'.length))
  const deleteBranch = `git -C ${brainRepository} branch -D ${branch} && git -C ${brainRepository} update-ref -d ${draft}`
  return worktree === null
    ? deleteBranch
    : `git -C ${brainRepository} worktree remove --force ${worktree} && ${deleteBranch}`
}
