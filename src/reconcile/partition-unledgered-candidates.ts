import { readLedgerSafely } from '../ledger/read-ledger-safely.ts'
import type { CitedCandidate } from './cited-candidate.ts'
import type { UnledgeredCandidates } from './unledgered-candidates.ts'

/** Split the wiki-cited candidates into the ones still needing a ledger and a
 * count of the ones that already carry one. A candidate already ledgered was
 * reconciled by an earlier run and must not be rebuilt. */
export const partitionUnledgeredCandidates = async (
  brainRepository: string,
  matched: readonly CitedCandidate[],
): Promise<UnledgeredCandidates> => {
  const candidates: CitedCandidate[] = []
  let alreadyLedgered = 0
  for (const candidate of matched) {
    const read = await readLedgerSafely(
      brainRepository,
      candidate.clip.metadata.clip_id,
    )
    if (read.kind === 'absent') candidates.push(candidate)
    else alreadyLedgered += 1
  }
  return { candidates, alreadyLedgered }
}
