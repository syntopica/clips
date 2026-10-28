import { refExists } from '../git/ref-exists.ts'
import { runGit } from '../git/run-git.ts'
import { ingestBranchName } from './ingest-branch-name.ts'
import { ingestDraftRef } from './ingest-draft-ref.ts'
import { saveIngestDraft } from './save-ingest-draft.ts'

/** Cleanup that refuses to destroy work: no `--force` on either command, so a
 * worktree with uncommitted changes or an unmerged branch survives and is
 * reported instead of deleted (SPEC:435-436: report every artifact
 * deliberately kept for recovery). Returns what was kept, or null when
 * everything was removed.
 *
 * Uncommitted synthesis is the exception to keeping the worktree: it is saved
 * as a draft commit first (saveIngestDraft), and then the checkout itself,
 * 2.4 GiB of instance for a few changed files, is removed with `--force`. The
 * branch stays as the marker that stops the clip being synthesized again until
 * an operator clears it. */
export const removeIngestWorktree = async (
  brainRepository: string,
  clipId: string,
  worktree: string,
): Promise<string | null> => {
  const branch = ingestBranchName(clipId)
  const draft = await saveIngestDraft(worktree, clipId)
  if (draft !== null) {
    const forced = await runGit(brainRepository, [
      'worktree',
      'remove',
      '--force',
      worktree,
    ])
    const kept = forced.exitCode === 0 ? [] : [`worktree ${worktree}`]
    return [...kept, `branch ${branch}`, `draft ${draft}`].join(', ')
  }
  const kept: string[] = []
  const removed = await runGit(brainRepository, [
    'worktree',
    'remove',
    worktree,
  ])
  if (removed.exitCode !== 0) kept.push(`worktree ${worktree}`)
  // A draft saved by an earlier run makes the branch its marker, even once
  // the checkout is clean: deleting it would let synthesis overwrite the draft.
  if (await refExists(brainRepository, ingestDraftRef(clipId))) {
    kept.push(`branch ${branch}`)
    return kept.join(', ')
  }
  const deleted = await runGit(brainRepository, ['branch', '-d', branch])
  if (deleted.exitCode !== 0) kept.push(`branch ${branch}`)
  return kept.length === 0 ? null : kept.join(', ')
}
