import { firstIssuePath } from '../clips/first-issue-path.ts'
import { JSON_PARSE_FAILED } from '../clips/json-parse-failed.ts'
import { parseJson } from '../clips/parse-json.ts'
import { readFileIfPresent } from '../clips/read-file-if-present.ts'
import { ULID_PATTERN } from '../clips/ulid-pattern.ts'
import { ledgerPath } from './ledger-path.ts'
import type { LedgerRead } from './ledger-read.ts'
import { LedgerSchema } from './ledger-schema.ts'
import { unsupportedLedgerVersionReason } from './unsupported-ledger-version-reason.ts'

/** Never throws on a ledger's contents: `clips status` has to describe the
 * whole store, and one unreadable ledger must cost one clip, not the run.
 * `clipId` here is a data path - it can be anything read off disk - so it is
 * validated before `ledgerPath` ever sees it, rather than inheriting
 * `ledgerPath`'s throw, which is reserved for a programming error. */
export const readLedger = async (
  brainRepository: string,
  clipId: string,
): Promise<LedgerRead> => {
  if (!ULID_PATTERN.test(clipId))
    return {
      kind: 'unreadable',
      reason: `clip_id is not a ULID: ${clipId}`,
    }

  const raw = await readFileIfPresent(ledgerPath(brainRepository, clipId))
  if (raw === null) return { kind: 'absent' }

  const parsed = parseJson(raw)
  if (parsed === JSON_PARSE_FAILED)
    return { kind: 'unreadable', reason: 'the ledger is not valid JSON' }

  const versionReason = unsupportedLedgerVersionReason(parsed)
  if (versionReason !== null)
    return { kind: 'unreadable', reason: versionReason }

  const ledger = LedgerSchema.safeParse(parsed)
  if (!ledger.success) {
    return {
      kind: 'unreadable',
      reason: `the ledger does not match schema 1: ${firstIssuePath(ledger.error)}`,
    }
  }
  return { kind: 'readable', ledger: ledger.data }
}
