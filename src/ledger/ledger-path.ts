import { join } from 'node:path'
import { ULID_PATTERN } from '../clips/ulid-pattern.ts'
import { ledgerRelativePath } from './ledger-relative-path.ts'

/** Throws on a clipId that is not a ULID: reaching this function with one is
 * a programming error, not a data condition, since every caller is expected
 * to validate first. Without this, a value like
 * `../../../../../etc/passwd0000000000` joins straight out of the repository
 * (`ledgerRelativePath` -> `join` performs no containment check). `readLedger`
 * validates the data-path case itself and never reaches this throw. */
export const ledgerPath = (brainRepository: string, clipId: string): string => {
  if (!ULID_PATTERN.test(clipId))
    throw new Error(
      `ledgerPath received a clip_id that is not a ULID: ${clipId}`,
    )
  return join(brainRepository, ledgerRelativePath(clipId))
}
