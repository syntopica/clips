/** SPEC:236-249, minus `published` and plus `unreadable`.
 *
 * `published` is gone because nothing returns it and nothing should: a ledger
 * that is present in origin/main is `reconciliation-pending`, since publication
 * is precisely the point at which the clip still has to be moved to processed/.
 * A state that is declared and never produced is how the old table hid the fact
 * that its publication check threw before it could answer.
 *
 * `unreadable` is deliberately distinct from `inconsistent`: nothing here
 * contradicts anything, the clip is simply a shape we do not read yet. */
export type DerivedState =
  | 'pending'
  | 'synthesized'
  | 'locally-stale'
  | 'reconciliation-pending'
  | 'reconciled'
  | 'needs-claude'
  | 'inconsistent'
  | 'unreadable'
