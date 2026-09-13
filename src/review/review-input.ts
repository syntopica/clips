/** What a reviewer is given to decide on.
 *
 * `authorModel` is the model that actually wrote this diff, taken from the
 * run's synthesis identity rather than from configuration. The two differ: the
 * synthesizer falls back when a quota runs out, and on 2026-08-08 agy's Claude
 * quota emptied mid-batch and synthesis silently continued on the same Gemini
 * model the review gate uses. Comparing the configured constants - which is all
 * `selectReviewer` can see - said they were different while the run had already
 * collapsed author and verifier into one model marking its own work. */
export type ReviewInput = {
  summary: string
  authorModel: string
  /** The clip under review. The terminal gate requires an apply to name it
   * (`a 01M098Y2MEC0`): with two operators on one FIFO an answer carries no
   * identity and no target, so a bare token - stale or cross-operator - would
   * be indistinguishable from a reviewed apply (observed 2026-08-18). */
  clipId: string
  fullDiff: () => Promise<string>
}
