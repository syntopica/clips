import type { Clip } from '../clips/clip.ts'
import { publishedLedgerCommit } from '../reconcile/published-ledger-commit.ts'
import { reconcileClip } from '../reconcile/reconcile-clip.ts'
import { routeToNeedsClaude } from '../reconcile/route-to-needs-claude.ts'
import { readSensitiveDomains } from '../routing/read-sensitive-domains.ts'
import { routeClip } from '../routing/route-clip.ts'
import type { StateEvidence } from '../state/state-evidence.ts'
import type { ClipOutcome } from './clip-outcome.ts'
import type { IngestDependencies } from './ingest-dependencies.ts'
import { processPendingClip } from './process-pending-clip.ts'
import type { Repositories } from './repositories.ts'

/** One clip, dispatched on its derived state. Synthesis happens only from
 * `pending` (SPEC:251); everything else is either reconciled without a model
 * or reported and left alone. */
export const ingestOneClip = async (
  repositories: Repositories,
  clip: Clip,
  evidence: StateEvidence,
  dependencies: IngestDependencies,
): Promise<ClipOutcome> => {
  if (evidence.state === 'reconciliation-pending') {
    const commit = await publishedLedgerCommit(
      repositories.brain,
      clip.metadata.clip_id,
    )
    if (commit === null) {
      process.stdout.write(
        `${clip.metadata.clip_id}: ledger not on origin/main yet; publication incomplete\n`,
      )
      return 'stopped'
    }
    await reconcileClip(repositories.clips, repositories.brain, clip, commit)
    return 'reconciled'
  }
  if (evidence.state !== 'pending') {
    process.stdout.write(
      `${clip.metadata.clip_id}: ${evidence.state} (${evidence.reason}); nothing to do\n`,
    )
    return 'stopped'
  }
  const decision = routeClip(
    clip.metadata,
    await readSensitiveDomains(repositories.brain),
  )
  if (decision.route === 'manual-only') {
    process.stdout.write(
      `${clip.metadata.clip_id}: ${decision.reason}; left untouched\n`,
    )
    return 'stopped'
  }
  if (decision.route === 'needs-claude') {
    await routeToNeedsClaude(repositories.clips, clip, {
      stage: 'routing',
      code: 'ROUTED_SENSITIVE',
      message: decision.reason,
    })
    return 'needs-claude'
  }
  return processPendingClip(repositories, clip, dependencies)
}
