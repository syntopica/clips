import type { WorktreeChange } from './worktree-change.ts'

/** The XY field of a porcelain=v2 `1` record, reduced to what validation can
 * accept. Anything unrecognised - deletions, type changes, unmerged states -
 * is `unsupported` and will be rejected with its raw record. */
export const classifyStatusXy = (xy: string): WorktreeChange['kind'] => {
  if (xy === 'A.' || xy === '.A' || xy === 'AA') return 'added'
  if (xy === 'M.' || xy === '.M' || xy === 'MM') return 'modified'
  return 'unsupported'
}
