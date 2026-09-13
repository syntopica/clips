import { currentBranch } from '../git/current-branch.ts'
import { dirtyPaths } from '../git/dirty-paths.ts'
import { fetchOrigin } from '../git/fetch-origin.ts'
import { refExists } from '../git/ref-exists.ts'
import { resolveCommit } from '../git/resolve-commit.ts'
import type { PreflightResult } from './preflight-result.ts'

/** SPEC:222-231: on main, and main equal to origin/main after a fetch.
 * Equality, not mere fast-forwardability - the pipeline ends in fast-forward
 * publication, and starting from a diverged or stale main turns a clean failure
 * into manual untangling.
 *
 * **A dirty tree is no longer refused, only reported.** It was, and it was the
 * wrong test: several sessions use this repository at once by design, so
 * somebody else's uncommitted edit is ordinary rather than exceptional, and
 * refusing on it blocked every clip in the queue over a file no run would ever
 * touch. Measured 2026-08-08 - a batch of 25 lost 18 to one unrelated modified
 * page, twice in a row.
 *
 * What dirtiness can actually break is the final `merge --ff-only` into the
 * main working tree, and only when the incoming commit touches a file that is
 * already dirty. A run publishes the pages it synthesized plus its own ledger,
 * so that collision needs somebody else to be editing the very page this clip
 * updates - rare, and git refuses it there by name ("Your local changes to the
 * following files would be overwritten by merge") without anything extra here.
 * The 18 clips lost on 2026-08-08 were not that case: the dirty file was a page
 * no run touched, and the merge would have succeeded. Everything before
 * publication happens in a private worktree, where the main tree's state is
 * irrelevant. */
export const preflightRepository = async (
  repository: string,
): Promise<PreflightResult> => {
  const branch = await currentBranch(repository)
  if (branch !== 'main')
    return { ok: false, reason: `${repository} is on ${branch}, expected main` }
  const dirty = await dirtyPaths(repository)
  if (dirty.length > 0) {
    process.stdout.write(
      `note: ${repository} has ${String(dirty.length)} uncommitted path(s) - ` +
        `${dirty.slice(0, 3).join(', ')}${dirty.length > 3 ? ', ...' : ''}. ` +
        'Continuing; publication refuses only on a real collision.\n',
    )
  }
  await fetchOrigin(repository)
  if (!(await refExists(repository, 'origin/main')))
    return { ok: false, reason: `${repository} has no origin/main` }
  const local = await resolveCommit(repository, 'main')
  const remote = await resolveCommit(repository, 'origin/main')
  if (local !== remote) {
    return {
      ok: false,
      reason: `${repository} main (${local.slice(0, 8)}) differs from origin/main (${remote.slice(0, 8)}); pull or push first`,
    }
  }
  return { ok: true }
}
