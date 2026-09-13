import { stripControlCharacters } from '../clips/strip-control-characters.ts'
import { answerOutcome } from './answer-outcome.ts'
import { askLine } from './ask-line.ts'
import { drainPendingInput } from './drain-pending-input.ts'
import type { ReviewOutcome } from './review-outcome.ts'
import type { Reviewer } from './reviewer.ts'

/** The manual gate that makes this phase safe (SPEC:330, 374-392). Everything
 * shown may originate in an untrusted page, so it is stripped of ANSI escapes
 * and control characters before it reaches the terminal.
 *
 * What each answer means, and why an apply has to name the clip, is in
 * `answerOutcome`. The id bounds the damage a stale line can do;
 * `drainPendingInput` removes its cause, and it runs before the summary rather
 * than before the prompt so the operator sees the diff and the prompt with
 * nothing already queued behind them. It is what makes a bare `s` safe too: a
 * skip is bound to no clip and would otherwise be answered by any stale line.
 * The prefix in the hint is sixteen characters because twelve was not enough to
 * tell two clips apart, and `applyAnswerNamesClip` carries that measurement. */
export const terminalReviewer: Reviewer = {
  automatic: false,
  review: async (input): Promise<ReviewOutcome> => {
    await drainPendingInput()
    process.stdout.write(`${stripControlCharacters(input.summary)}\n`)
    const applyHint = `a ${input.clipId.slice(0, 16).toLowerCase()}`
    for (;;) {
      const answer = await askLine(
        `[a]pply (as \`${applyHint}\`)  [s]kip  [c]laude  [f]ull diff  [q]uit > `,
      )
      const outcome = await answerOutcome(answer, input.clipId, applyHint)
      if (outcome !== null) return outcome
      if (answer === 'f')
        process.stdout.write(
          `${stripControlCharacters(await input.fullDiff())}\n`,
        )
    }
  },
}
