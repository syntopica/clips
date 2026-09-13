import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import { splitNul } from '../git/split-nul.ts'
import { classifyStatusXy } from './classify-status-xy.ts'
import type { WorktreeChange } from './worktree-change.ts'

/** `git status --porcelain=v2 -z` sees untracked files, which `git diff` does
 * not - and a newly created page is the common case (SPEC:346-350). Records:
 * `1 <XY> ... <path>` for tracked changes, `? <path>` for untracked; renames
 * (`2`), unmerged (`u`) and anything else arrive as `unsupported` and are
 * rejected downstream with the raw record as evidence. */
export const collectWorktreeChanges = async (
  worktree: string,
): Promise<WorktreeChange[]> => {
  const args = ['status', '--porcelain=v2', '-z', '--untracked-files=all']
  const result = await runGit(worktree, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
  const changes: WorktreeChange[] = []
  for (const record of splitNul(result.stdout)) {
    if (record.startsWith('? ')) {
      changes.push({ path: record.slice(2), kind: 'untracked', detail: record })
      continue
    }
    if (record.startsWith('1 ')) {
      const fields = record.split(' ')
      changes.push({
        path: fields.slice(8).join(' '),
        kind: classifyStatusXy(fields[1] ?? ''),
        detail: record,
      })
      continue
    }
    changes.push({ path: record, kind: 'unsupported', detail: record })
  }
  return changes
}
