import { pathExistsInRef } from '../git/path-exists-in-ref.ts'
import { refExists } from '../git/ref-exists.ts'
import { ledgerRelativePath } from '../ledger/ledger-relative-path.ts'
import type { StateEvidence } from './state-evidence.ts'

/** Where a ledger has got to: written, committed, or published. Asked as three
 * presence questions rather than by resolving a commit and testing ancestry -
 * see ledgerIntroducingCommit for why that answer cannot be trusted.
 *
 * A ledger reachable from origin/main is `reconciliation-pending`, not
 * `published`: the brain side is done, the clip still has to be moved to
 * processed/ and have its state.json written. */
export const ledgerPublicationState = async (
  brainRepository: string,
  clipId: string,
): Promise<StateEvidence> => {
  const path = ledgerRelativePath(clipId)
  if (!(await refExists(brainRepository, 'origin/main'))) {
    return {
      state: 'locally-stale',
      reason: `${path} exists but origin/main is not fetched, so publication cannot be checked`,
    }
  }
  if (await pathExistsInRef(brainRepository, 'origin/main', path))
    return {
      state: 'reconciliation-pending',
      reason: `${path} is present in origin/main`,
    }
  if (await pathExistsInRef(brainRepository, 'HEAD', path))
    return {
      state: 'locally-stale',
      reason: `${path} is committed locally but absent from origin/main`,
    }
  return {
    state: 'synthesized',
    reason: `${path} exists in the working tree but no commit contains it`,
  }
}
