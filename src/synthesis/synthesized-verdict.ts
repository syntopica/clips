/** What the model itself reported about a synthesis run: the pages it says it
 * touched, whether it escalated, and why. Split from `SynthesisResult` because
 * the transport - not the model - is the one that can name which model ran, so
 * a parser of the model's own final message must not be asked for it. */
export type SynthesizedVerdict = {
  pagesTouched: string[]
  needsClaude: boolean
  skipped: boolean
  reason: string
}
