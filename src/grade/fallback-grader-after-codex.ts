import { agyBulkGrader } from './agy-bulk-grader.ts'
import { agyFineGrader } from './agy-fine-grader.ts'
import { cursorGrader } from './cursor-grader.ts'
import type { GradeRunner } from './grade-runner.ts'
import { modelsThatWroteBatch } from './models-that-wrote-batch.ts'

/** The grader to use once the codex workspace is empty - and the enforcement of
 * the author/verifier split, which until now lived only in prose.
 *
 * Unpinned, grading fell back to `agy-fine`, which is also the default
 * synthesis model. So the moment codex was walled the page's own author graded
 * it, silently, with a report that read exactly like a real verdict. Prose in
 * `CLAUDE.md` told the caller to pin around that; a rule the caller must
 * remember is not a pin.
 *
 * What it refuses is decided by `modelsThatWroteBatch`, which prefers the
 * author the run reported over the transport the environment asked for. That
 * distinction is the whole of the 2026-08-03 failure: a `--manual` batch was
 * written by a Claude session in the operator's terminal, every agy model was
 * therefore free, and grading stopped anyway because the variable was the only
 * thing anyone asked.
 *
 * Cursor first since 2026-09-11, and the order is about quota rather than
 * capability. It is a fine-tier model on a fourth account that has never
 * written a page here, so it is both the most independent grader available and
 * the only one whose quota is not competing with synthesis - the agy fine tier
 * empties in roughly two batches and is the default synthesizer besides, which
 * is how the fallback kept arriving at a model it had to refuse. Then agy-fine,
 * then the bulk tier, because a page graded on a cheaper model beats one graded
 * by its own author.
 *
 * When every remaining model may have written the batch, there is no honest
 * fallback left and this throws: an ungraded page the operator knows about
 * beats a graded-looking one the author signed off on. */
export const fallbackGraderAfterCodex = (
  author: string | null,
  synthesisRunner: string | undefined,
): GradeRunner => {
  const written = modelsThatWroteBatch(author, synthesisRunner)
  if (!written.includes('cursor')) return cursorGrader
  if (!written.includes('agy-fine')) return agyFineGrader
  if (!written.includes('agy-bulk')) return agyBulkGrader
  throw new Error(
    'codex is out of credits and this batch may have been written by every ' +
      `remaining model (author=${author ?? 'unreported'}, ` +
      `CLIPS_SYNTHESIS_RUNNER=${synthesisRunner ?? 'unset'}), so grading here ` +
      'would be the author verifying itself. Pin CLIPS_GRADE_RUNNER to a model ' +
      'that did not write the batch, or pin CLIPS_SYNTHESIS_RUNNER so one stays ' +
      'free.',
  )
}
