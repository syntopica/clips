/** The message for a page whose evidence exceeds this transport's ceiling. Its
 * whole job is to carry the two numbers: a refusal without them is the bare
 * `exited 1` this check exists to replace.
 *
 * It no longer says "split the page". That advice was written when the ceiling
 * was one shared 512 KB, and it set per-page grading against hub-first
 * granularity: it told the operator to break up a hub for accumulating sources
 * exactly as it had been told to. The remedy now is a transport with more room,
 * and naming it is the difference between a refusal that ends the matter and
 * one that says what to do next. */
export const overBudgetFailure = (
  bytes: number,
  sources: number,
  ceilingBytes: number,
): string =>
  `evidence is ${String(Math.round(bytes / 1024))} KB across ${String(sources)} sources, over this transport's ${String(Math.round(ceilingBytes / 1024))} KB ceiling; grade it on one with more room`
