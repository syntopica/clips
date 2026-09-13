import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { rewriteClaimRefs } from '../citations/rewrite-claim-refs.ts'
import type { Clip } from '../clips/clip.ts'
import { routeToNeedsClaude } from '../reconcile/route-to-needs-claude.ts'
import { formatWorktreePages } from '../validation/format-worktree-pages.ts'
import type { ClipOutcome } from './clip-outcome.ts'
import type { Repositories } from './repositories.ts'

/** Step 7a: turn the bare claim markers the synthesizer wrote into links into
 * each page's own `## Sources` section.
 *
 * Between validation and the review gate, in the same slot `regenerateIndexMap`
 * occupies and for the same reason: the reviewer has to approve the text that
 * gets committed, not one thing while another is published. Validation has
 * already refused any marker that names no source, so what arrives here
 * resolves.
 *
 * A rewritten page is reformatted, because `[[S1]](#sources)` is eleven
 * characters longer than `[S1]` and prettier wraps prose at eighty. Skipping
 * that is how 15 clips landed on origin/main with violations and left
 * `pnpm run check` red until a manual sweep. Prettier failing here routes the
 * clip out rather than crashing the run, as every other derived step does.
 *
 * A page nobody marked comes out byte-identical, which is every page the wiki
 * had before the scheme, so this writes nothing and formats nothing on them. */
export const rewriteClaimMarkers = async (
  repositories: Repositories,
  clip: Clip,
  worktree: string,
  paths: readonly string[],
): Promise<{ rewritten: string[] } | { outcome: ClipOutcome }> => {
  const rewritten: string[] = []
  for (const path of paths) {
    const absolute = join(worktree, path)
    const text = await readFile(absolute, 'utf8')
    const next = rewriteClaimRefs(text)
    if (next === text) continue
    await writeFile(absolute, next)
    rewritten.push(path)
  }
  if (rewritten.length === 0) return { rewritten }
  const formatFailure = await formatWorktreePages(
    repositories.brain,
    worktree,
    rewritten,
  )
  if (formatFailure === null) return { rewritten }
  await routeToNeedsClaude(repositories.clips, clip, {
    stage: 'validation',
    code: 'CLAIM_REWRITE_FAILED',
    message: formatFailure,
  })
  return { outcome: 'needs-claude' }
}
