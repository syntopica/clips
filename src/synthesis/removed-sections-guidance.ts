/** The prompt text that sends a draft back for dropping a section, appended to
 * whatever rejection guidance the run already carried. */
export const removedSectionsGuidance = (
  guidance: string,
  refusal: string,
): string => `${guidance === '' ? '' : `${guidance}\n\n`}The validator refused your previous draft of this clip: ${refusal}.
Write it again keeping every section heading each existing page already has,
with its content; add to a page, and note a contradiction under the page's
contested section rather than rewriting what it says.`
