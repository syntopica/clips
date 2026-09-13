/** The grade pass as an injected dependency, so the ingest lane can run it
 * without importing a command and a test can drive it without spending codex
 * quota. It returns the pass's own exit code, which the ingest run reports
 * rather than acts on: an unsupported claim is a finding for the operator to
 * read, not a reason to abandon a page that is already published.
 *
 * `author` is the model the synthesis run reported for itself. It is on this
 * signature rather than read from the environment because the ingest lane knows
 * which synthesizer actually ran and the environment only knows which one was
 * asked for - the difference that made the author/verifier guard refuse a batch
 * a human had written. */
export type PageGrader = {
  grade(
    brainRepository: string,
    clipsRepository: string,
    pages: readonly string[],
    author: string | null,
  ): Promise<number>
}
