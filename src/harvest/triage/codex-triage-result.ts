/** One codex triage attempt, with the one failure reason the caller can act on.
 *
 * `message` keeps the existing contract - the raw final message, or null when
 * there is nothing to parse. `outOfCredits` is separate rather than a null
 * variant because the two call for opposite handling: a null degrades the batch
 * to `review`, while the credit wall is worth switching transport over. */
export type CodexTriageResult = {
  message: string | null
  outOfCredits: boolean
}
