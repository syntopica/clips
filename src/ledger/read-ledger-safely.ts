import type { LedgerRead } from './ledger-read.ts'
import { readLedger } from './read-ledger.ts'

/** `readLedger` handles every malformed document it can see, but the read
 * itself can still fail: `readFileIfPresent` deliberately rethrows anything
 * that is not ENOENT, so a directory at .ingest/clips/<clip_id>.json raises
 * EISDIR. Same wrapper, same reason, as readClipSafely. */
export const readLedgerSafely = async (
  brainRepository: string,
  clipId: string,
): Promise<LedgerRead> => {
  try {
    return await readLedger(brainRepository, clipId)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      kind: 'unreadable',
      reason: `the ledger could not be read: ${message.replace(/\r?\n/g, ' ')}`,
    }
  }
}
