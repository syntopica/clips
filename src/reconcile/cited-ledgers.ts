import type { CitedCandidate } from './cited-candidate.ts'

/** What `buildCitedLedgers` returns: the serialized ledger files and, in the
 * same order, the candidates that produced one. */
export type CitedLedgers = {
  ledgers: { path: string; text: string }[]
  buildable: CitedCandidate[]
}
