/** The observation behind a derived state, as a fixed code. `reason` is the
 * same observation in prose for `clips status`, and it can name a clip id, a
 * path or a commit; the code names none of them, so a consumer that must not
 * carry content (`clips status --json --items`) reports the code alone. */
export type StateReasonCode =
  | 'thin_clip'
  | 'routed_needs_claude'
  | 'state_bucket_mismatch'
  | 'ledger_unreadable'
  | 'ledger_under_pending'
  | 'processed_without_commit'
  | 'processed_under_pending'
  | 'commit_unresolved'
  | 'no_ledger'
  | 'clip_unhashable'
  | 'content_mismatch'
  | 'origin_not_fetched'
  | 'ledger_on_origin'
  | 'ledger_committed_locally'
  | 'ledger_uncommitted'
  | 'reconciled'
