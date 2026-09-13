import { readLedgerSafely } from '../ledger/read-ledger-safely.ts'
import type { DeriveClipStateInput } from './derive-clip-state-input.ts'
import { deriveFromLedger } from './derive-from-ledger.ts'
import { resolveHandProcessed } from './resolve-hand-processed.ts'
import { resolveProcessedBucket } from './resolve-processed-bucket.ts'
import type { StateEvidence } from './state-evidence.ts'

/** Routing only: each arm's reasoning lives in its own file. Nothing here
 * throws, because `clips status` reports every clip in the store and one bad
 * clip must cost one line, not the run. */
export const deriveClipState = async (
  input: DeriveClipStateInput,
): Promise<StateEvidence> => {
  const { clip, brainRepository } = input
  if (clip.kind === 'thin') return { state: 'unreadable', reason: clip.reason }
  if (clip.bucket === 'needs-claude') {
    return {
      state: 'needs-claude',
      reason: 'the clip is under clips/needs-claude/',
    }
  }
  if (clip.bucket === 'processed')
    return resolveProcessedBucket(brainRepository, clip.state)
  if (clip.state.status === 'needs-claude') {
    return {
      state: 'inconsistent',
      reason:
        'state.json says needs-claude but the clip sits under pending/, not clips/needs-claude/',
    }
  }

  const read = await readLedgerSafely(brainRepository, clip.metadata.clip_id)
  if (read.kind === 'unreadable')
    return { state: 'inconsistent', reason: read.reason }

  if (clip.state.status === 'processed') {
    return read.kind === 'absent'
      ? resolveHandProcessed(brainRepository, clip.state.brainCommit)
      : {
          state: 'reconciliation-pending',
          reason: `a ledger exists for ${clip.metadata.clip_id} but the clip is under pending/`,
        }
  }

  // No ledger and no branch is ever inspected, so the reason says only what was
  // actually checked.
  if (read.kind === 'absent') return { state: 'pending', reason: 'no ledger' }
  return deriveFromLedger(brainRepository, clip, read.ledger)
}
