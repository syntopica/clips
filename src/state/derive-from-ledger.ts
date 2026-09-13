import type { Clip } from '../clips/clip.ts'
import { contentSha256 } from '../clips/content-sha256.ts'
import { LedgerContentMismatchError } from '../ledger/ledger-content-mismatch-error.ts'
import type { Ledger } from '../ledger/ledger.ts'
import { ledgerPublicationState } from './ledger-publication-state.ts'
import type { StateEvidence } from './state-evidence.ts'

/** A readable ledger says this clip was ingested. Before believing where it
 * got to, check that it still describes these bytes: SPEC:523-525 forbids
 * reconciling a mismatch silently. contentSha256 throws on a clip missing
 * index.md, which a Clip can become after discovery, so the hash is guarded
 * too - one clip's missing file must not abort the whole status run. */
export const deriveFromLedger = async (
  brainRepository: string,
  clip: Clip,
  ledger: Ledger,
): Promise<StateEvidence> => {
  let recomputed: string
  try {
    recomputed = await contentSha256(clip.directory)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      state: 'inconsistent',
      reason: `the clip cannot be hashed: ${message}`,
    }
  }
  if (recomputed !== ledger.contentSha256) {
    const mismatch = new LedgerContentMismatchError(
      clip.metadata.clip_id,
      ledger.contentSha256,
      recomputed,
    )
    return {
      state: 'inconsistent',
      reason: `${mismatch.code}: ${mismatch.message}`,
    }
  }
  return ledgerPublicationState(brainRepository, clip.metadata.clip_id)
}
