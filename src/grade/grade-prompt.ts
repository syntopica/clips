import { GRADE_MARKER_AND_OUTPUT_INSTRUCTION } from './grade-marker-and-output-instruction.ts'
import { gradePromptEvidenceAndScope } from './grade-prompt-evidence-and-scope.ts'

/** The grading prompt. It is deliberately the mirror image of `codexPrompt`:
 * that one generates pages, this one is a second model that never saw the
 * generation and is asked only whether the page overstates its evidence. The
 * synthesizer being its own verifier is the setup the evaluation literature
 * warns against - see [[topics/model-evaluation]].
 *
 * Both the page and the clips are handed over as paths, and both are named as
 * untrusted: the clip is captured web content, and the page was written from
 * that content by a model, so neither may issue instructions. The grader has no
 * web access on purpose. A grader that can search will confirm a claim from
 * somewhere else on the internet, which answers a different question than the
 * one asked - the claim has to be supported by THIS page's cited sources.
 *
 * Assembled from gradePromptEvidenceAndScope and
 * GRADE_MARKER_AND_OUTPUT_INSTRUCTION, split only to keep this function under
 * the line limit; concatenated they are exactly this prompt. */
export const gradePrompt = (
  pagePath: string,
  clipPaths: readonly string[],
): string =>
  `${gradePromptEvidenceAndScope(pagePath, clipPaths)}${GRADE_MARKER_AND_OUTPUT_INSTRUCTION}`
