/** The classification process boundary, injected the same way `CodexRunner` is:
 * the batching and verdict-matching logic is testable without spending codex
 * quota. Takes one TSV batch, returns the raw final message. */
export type TriageRunner = {
  run(batch: string): Promise<string | null>
}
