import { changeFailure } from './change-failure.ts'
import { collectWorktreeChanges } from './collect-worktree-changes.ts'
import { contentValidationFailure } from './content-validation-failure.ts'
import { formatWorktreePages } from './format-worktree-pages.ts'
import { orphanPageFailure } from './orphan-page-failure.ts'
import { validateLimits } from './validate-limits.ts'
import type { ValidationResult } from './validation-result.ts'

/** Every failure is hard (SPEC:344). The result's `paths` is the exact set the
 * committer may stage; nothing else in the worktree is eligible. Deletions,
 * renames, type changes and anything else the change collector cannot classify
 * arrive as `unsupported` and are rejected with their raw status record.
 *
 * Validation also normalises: an accepted page is left prettier-formatted, so
 * what the reviewer approves and the committer stages passes the brain's own
 * `pnpm run check`.
 *
 * The last check is SCHEMA's connect-or-shelve rule: a page this synthesis
 * created that no other page links to fails here rather than being found by the
 * orphan count days later (see `orphanPageFailure`). */
export const validateWorktree = async (
  brainRepository: string,
  worktree: string,
): Promise<ValidationResult> => {
  const changes = await collectWorktreeChanges(worktree)
  if (changes.length === 0)
    return contentValidationFailure('no pages were written')
  for (const change of changes) {
    if (change.kind === 'unsupported')
      return contentValidationFailure(`unsupported change (${change.detail})`)
    const failure = await changeFailure(worktree, change)
    if (failure !== null)
      return contentValidationFailure(`${change.path}: ${failure}`)
  }
  const untracked = new Set(
    changes
      .filter((change) => change.kind === 'untracked')
      .map((change) => change.path),
  )
  const paths = changes.map((change) => change.path).sort()
  const formatFailure = await formatWorktreePages(
    brainRepository,
    worktree,
    paths,
  )
  if (formatFailure !== null) return contentValidationFailure(formatFailure)
  const limits = await validateLimits(worktree, paths, untracked)
  if (!limits.ok) return limits
  const orphan = await orphanPageFailure(worktree, [...untracked])
  return orphan === null ? limits : contentValidationFailure(orphan)
}
