import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import { changedLineCounts } from './changed-line-counts.ts'
import { contentValidationFailure } from './content-validation-failure.ts'
import { SYNTHESIS_LIMITS } from './synthesis-limits.ts'
import type { ValidationResult } from './validation-result.ts'

/** The size limits from SPEC:528-543, applied after per-path validation has
 * passed. The diff-bytes limit sees tracked changes only - untracked pages are
 * bounded by the per-page and total line limits instead, which count them
 * whole. */
export const validateLimits = async (
  worktree: string,
  paths: string[],
  untracked: Set<string>,
): Promise<ValidationResult> => {
  if (paths.length > SYNTHESIS_LIMITS.pagesTouched) {
    return contentValidationFailure(
      `${String(paths.length)} pages exceed the limit of ${String(SYNTHESIS_LIMITS.pagesTouched)}`,
    )
  }
  const counts = await changedLineCounts(worktree, paths, untracked)
  let total = 0
  for (const [path, lines] of counts) {
    total += lines
    if (lines > SYNTHESIS_LIMITS.changedLinesPerPage) {
      return contentValidationFailure(
        `${path}: ${String(lines)} changed lines exceed ${String(SYNTHESIS_LIMITS.changedLinesPerPage)}`,
      )
    }
  }
  if (total > SYNTHESIS_LIMITS.totalChangedLines) {
    return contentValidationFailure(
      `${String(total)} changed lines exceed ${String(SYNTHESIS_LIMITS.totalChangedLines)}`,
    )
  }
  const args = ['diff', 'HEAD', '--', ...paths]
  const diff = await runGit(worktree, args)
  if (diff.exitCode !== 0)
    throw new GitFailedError(args, diff.exitCode, diff.stderr)
  if (Buffer.byteLength(diff.stdout, 'utf8') > SYNTHESIS_LIMITS.diffBytes) {
    return contentValidationFailure(
      `the diff exceeds ${String(SYNTHESIS_LIMITS.diffBytes)} bytes`,
    )
  }
  return { ok: true, paths }
}
