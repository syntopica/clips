/** Flags `clips harvest` accepts. `source` narrows the run to one collector;
 * `promote` re-reads a previous run's ticked Review boxes instead of
 * harvesting again. */
export type HarvestOptions = {
  source: string | null
  dryRun: boolean
  promote: boolean
  /** Capture every entry in the run, not only the ticked ones. Capture is not a
   * judgement: an article on disk can be reclassified, one that was never
   * fetched can only be re-requested and may already be gone. */
  captureAll: boolean
  /** The triage run to act on, `YYYY-MM-DD`, or null for today. Promoting the
   * previous day's ticks after midnight is the case this exists for. */
  date: string | null
  /** Where the newsletter sweep starts reading mail, `YYYY-MM-DD`. Null lets
   * the run derive it from the last run that actually read newsletters. */
  since: string | null
}
