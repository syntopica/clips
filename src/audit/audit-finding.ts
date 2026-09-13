/** One thing the audit found wrong, flat rather than nested so the report can
 * group by check without walking a tree. `subject` is the page or clip the
 * reader has to open; `detail` says what is wrong with it in one line. */
export type AuditFinding = {
  check:
    | 'source-drift'
    | 'unresolved-citation'
    | 'missing-ledger-page'
    | 'stale-page'
    | 'stale-verification'
    | 'unverifiable-page'
    | 'open-contradiction'
    | 'inline-maths'
    | 'unclosed-maths-block'
    | 'unresolved-claim-ref'
    | 'uncited-source'
    | 'unreadable-source'
    | 'ungrounded-quote'
    | 'undated-supersession'
  subject: string
  detail: string
}
