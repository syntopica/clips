import { AGY_BULK_MODEL } from '../models/agy-bulk-model.ts'
import { AGY_FINE_MODEL } from '../models/agy-fine-model.ts'
import { agyReviewer } from '../review/agy-reviewer.ts'
import type { Reviewer } from '../review/reviewer.ts'
import { terminalReviewer } from '../review/terminal-reviewer.ts'

/** Which gate reads the diff. A person by default; `--auto-review` hands it to
 * agy on a model the synthesizer could not have been.
 *
 * **Author and verifier stay apart.** The standing rule in `CLAUDE.md` is that
 * when one model writes something and another checks it, they must not resolve
 * to the same model - a fallback that quietly collapses the two produces a
 * verdict that reads exactly like a real one. Synthesis runs on
 * `AGY_FINE_MODEL`, so the gate runs on `AGY_BULK_MODEL`, and if the two ever
 * become the same value this throws rather than reviewing. `selectPageGrader`'s
 * sibling guard exists for the same reason.
 *
 * The flag is off by default and stays that way. It is not a convenience: the
 * human gate is what stands between an injected instruction inside a captured
 * article and the wiki, given `runAgySynthesis` already carries
 * `--dangerously-skip-permissions` by operator decision. What makes the
 * automatic gate defensible is that it is bounded (`diffNeedsHuman` keeps new
 * pages and `index.md` for a person) and fail-closed (anything unreadable
 * escalates rather than applying), not that a model is good at reviewing. */
export const selectReviewer = (autoReview: boolean): Reviewer => {
  if (!autoReview) return terminalReviewer
  // Widened deliberately: the two constants differ today, so TypeScript calls
  // the comparison impossible and refuses it. The guard is here for the edit
  // that makes them equal, which is exactly when nobody would notice.
  const author: string = AGY_FINE_MODEL
  const verifier: string = AGY_BULK_MODEL
  if (verifier === author) {
    throw new Error(
      `--auto-review would grade the synthesizer's own work: AGY_BULK_MODEL and ` +
        `AGY_FINE_MODEL are both "${verifier}". Point one of them elsewhere.`,
    )
  }
  process.stdout.write(`reviewer: agy ${AGY_BULK_MODEL}\n`)
  return agyReviewer(AGY_BULK_MODEL)
}
