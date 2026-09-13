import { applyAnswerNamesClip } from './apply-answer-names-clip.ts'
import { askFreeTextLine } from './ask-free-text-line.ts'
import type { ReviewOutcome } from './review-outcome.ts'

/** Turn one line typed at the terminal gate into a verdict, or null when the
 * line decides nothing and the gate should ask again.
 *
 * An apply must name the clip (`a <id-prefix>`, sixteen characters or more):
 * several operators can share the gate's stdin through a FIFO, and a bare
 * token carries no target, so a stale or cross-operator answer would be
 * indistinguishable from a reviewed apply (observed 2026-08-18). An apply that
 * names nothing, or the wrong clip, says what to type and decides nothing.
 *
 * A skip asks why. The answer is stored on the clip and handed to the next
 * synthesis, so the model is told what was wrong instead of producing the same
 * draft again. An empty answer is accepted: pressing return must stay a way out
 * of the gate, and "no reason given" is a fair thing to record. */
export const answerOutcome = async (
  answer: string,
  clipId: string,
  applyHint: string,
): Promise<ReviewOutcome | null> => {
  if (answer === 'a' || answer.startsWith('a ')) {
    if (applyAnswerNamesClip(answer, clipId))
      return { verdict: 'apply', reason: '' }
    process.stdout.write(`apply must name this clip: type \`${applyHint}\`\n`)
    return null
  }
  if (answer === 'c') return { verdict: 'claude', reason: '' }
  if (answer === 'q') return { verdict: 'quit', reason: '' }
  if (answer === 's') {
    const reason = await askFreeTextLine('why? (one line) > ')
    return {
      verdict: 'skip',
      reason: reason === '' ? 'no reason given' : reason,
    }
  }
  return null
}
