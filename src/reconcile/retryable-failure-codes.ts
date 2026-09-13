/** The escalations a re-run can actually clear, and the only ones
 * `clips requeue` will undo.
 *
 * An allowlist, not a denylist. The two codes here mean the transport produced
 * nothing usable - a model that died mid-run, a diff the validator refused -
 * and the answer to both is to synthesize the clip again. Everything else is
 * somebody's decision rather than a transport's failure:
 * `ROUTED_SENSITIVE` is the routing table, which is deterministic precisely so
 * that nothing downstream can lower it, and `REVIEWER_ESCALATED` is a human
 * who read the diff and sent it to a person. Requeueing either would put the
 * clip back in front of the machine that was already overruled.
 *
 * `AUTO_REVIEWER_ESCALATED` is the third case and it belongs with the first
 * two. Nobody was overruled: a model applied the review policy of the moment,
 * and that policy is code. When it changes the old verdicts are stale, not
 * sacred - on 2026-08-08 the new-page bound was lifted and four clips parked
 * under it had no supported way back, which is the same dead end this command
 * was written to remove. */
export const RETRYABLE_FAILURE_CODES: readonly string[] = [
  'MODEL_ESCALATED',
  'CONTENT_VALIDATION_FAILED',
  'AUTO_REVIEWER_ESCALATED',
]
