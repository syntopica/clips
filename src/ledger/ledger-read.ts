import type { Ledger } from './ledger.ts'

/** Three outcomes, one discriminant. `absent` is a clip nobody has processed
 * yet and is not a problem; `unreadable` is a problem and carries what is
 * wrong with it. Collapsing the two would report a corrupt ledger as an
 * un-ingested clip. */
export type LedgerRead =
  | { kind: 'absent' }
  | { kind: 'readable'; ledger: Ledger }
  | { kind: 'unreadable'; reason: string }
