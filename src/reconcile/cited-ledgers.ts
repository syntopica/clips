import type { CitedCandidate } from './cited-candidate.ts'
import type { CitedLedger } from './cited-ledger.ts'

/** What `buildCitedLedgers` returns: the serialized ledger files and, in the
 * same order, the candidates that produced one. */
export type CitedLedgers = {
  ledgers: CitedLedger[]
  buildable: CitedCandidate[]
}
