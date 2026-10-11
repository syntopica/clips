import { collectWorktreeChanges } from './collect-worktree-changes.ts'
import { removedSectionFailure } from './removed-section-failure.ts'

/** The first modified page in the worktree that lost a section it already had,
 * as `<path>: <why>`, or null when every modified page kept its sections. The
 * validator refuses the same thing later; this is the early look a retry needs
 * before that refusal parks the clip. */
export const removedSectionsRefusal = async (
  worktree: string,
): Promise<string | null> => {
  for (const change of await collectWorktreeChanges(worktree)) {
    if (!change.path.endsWith('.md')) continue
    const failure = await removedSectionFailure(worktree, change)
    if (failure !== null) return `${change.path}: ${failure}`
  }
  return null
}
