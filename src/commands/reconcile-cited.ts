import { EXIT_CODE } from '../cli/exit-code.ts'
import { discoverClips } from '../clips/discover-clips.ts'
import { resolveCommit } from '../git/resolve-commit.ts'
import { buildCitedLedgers } from '../reconcile/build-cited-ledgers.ts'
import { citedCandidates } from '../reconcile/cited-candidates.ts'
import { citedPagesByKey } from '../reconcile/cited-pages-by-key.ts'
import { finishCitedReconcile } from '../reconcile/finish-cited-reconcile.ts'
import { partitionUnledgeredCandidates } from '../reconcile/partition-unledgered-candidates.ts'
import { publishCitedLedgers } from '../reconcile/publish-cited-ledgers.ts'
import type { Repositories } from './repositories.ts'

/** Reconcile the pending clips whose urls the wiki already cites.
 *
 * These clips are bookkeeping lag, not missing work: a page carrying the url
 * in its `sources:` was written from other evidence, so re-synthesizing them
 * would duplicate what the wiki already holds, and `requeue` moves the other
 * direction. Measured 2026-08-18: 518 of 1,161 pending clip urls were of this
 * shape. Each candidate gets a ledger whose `pagesTouched` names the pages
 * citing it and whose synthesizer block is the honest sentinel - no model ran.
 * Ledgers are published to origin/main first, then the clips move to
 * `processed/` in one commit, the same order and state `reconcileClip` uses
 * clip by clip. */
export const reconcileCited = async (
  repositories: Repositories,
  dryRun: boolean,
): Promise<number> => {
  const clips = await discoverClips(repositories.clips)
  const cited = await citedPagesByKey(repositories.brain)
  const matched = citedCandidates(clips, cited)
  const { candidates, alreadyLedgered } = await partitionUnledgeredCandidates(
    repositories.brain,
    matched,
  )
  process.stdout.write(
    `${String(matched.length)} pending clip(s) cited by the wiki, ` +
      `${String(alreadyLedgered)} already carrying a ledger, ` +
      `${String(candidates.length)} to reconcile\n`,
  )
  if (candidates.length === 0) return EXIT_CODE.success
  if (dryRun) {
    for (const candidate of candidates) {
      process.stdout.write(
        `${candidate.clip.metadata.clip_id} -> ${candidate.pages.join(', ')}\n`,
      )
    }
    return EXIT_CODE.success
  }

  const { ledgers, buildable } = await buildCitedLedgers(
    repositories,
    candidates,
    await resolveCommit(repositories.clips, 'main'),
    await resolveCommit(repositories.brain, 'HEAD'),
  )
  if (buildable.length === 0) return EXIT_CODE.success

  const brainCommit = await publishCitedLedgers(
    repositories.brain,
    ledgers,
    `brain: reconcile ${String(buildable.length)} cited clips`,
  )
  process.stdout.write(
    `published ${String(ledgers.length)} ledger(s) in ${brainCommit.slice(0, 7)}\n`,
  )
  await finishCitedReconcile(repositories.clips, buildable, brainCommit)
  process.stdout.write(
    `${String(buildable.length)} clip(s) reconciled to processed\n`,
  )
  return EXIT_CODE.success
}
