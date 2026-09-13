/** Which models a synthesis run may have used, from `CLIPS_SYNTHESIS_RUNNER`.
 *
 * The grade lane needs this because the page in front of it was written by one
 * of these, and a grader that is the same model is the author verifying itself
 * - the exact collapse the pass exists to prevent. A transport that can switch
 * mid-batch returns both of its models, since the operator grading afterwards
 * cannot tell which one wrote which page.
 *
 * The accepted names are `selectSynthesisTransport`'s, deliberately restated
 * rather than imported: this module answers a question about models, not about
 * which function to call, and an unrecognised value throws here for the same
 * reason it throws there - a typo must not quietly widen or narrow the set. */
export const synthesisModelNames = (
  name: string | undefined,
): readonly string[] => {
  if (name === undefined || name === 'fallback' || name === 'agy')
    return ['agy-fine', 'agy-bulk']
  if (name === 'agy-fine') return ['agy-fine']
  if (name === 'agy-bulk') return ['agy-bulk']
  if (name === 'codex') return ['codex']
  if (name === 'cursor') return ['cursor']
  throw new Error(
    `Unknown CLIPS_SYNTHESIS_RUNNER "${name}" - expected "codex", "cursor", "agy-fine", "agy-bulk" or "fallback".`,
  )
}
