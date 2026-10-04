import { collectWorktreeChanges } from './collect-worktree-changes.ts'

/** Whether a synthesis left no change at all in its worktree. */
export const worktreeIsUnchanged = async (worktree: string): Promise<boolean> =>
  (await collectWorktreeChanges(worktree)).length === 0
