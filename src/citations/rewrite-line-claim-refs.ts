import { BARE_CLAIM_REF_PATTERN } from './bare-claim-ref-pattern.ts'

/** One line with its bare markers turned into links into the page's own
 * `## Sources` section, leaving inline code spans alone.
 *
 * `withoutInlineCode` is the reader's version of this exclusion and cannot be
 * reused here: it deletes the span, and a rewrite has to put the line back
 * together. So the line is split on its code spans and only the parts between
 * them are rewritten - [[topics/llm-wiki]] describes this convention in
 * `` `[S1]` `` and must come out unchanged.
 *
 * `#sources` is GitHub's anchor for the `## Sources` heading every page with
 * sources carries. */
export const rewriteLineClaimRefs = (line: string): string =>
  line
    .split(/(`[^`]*`)/u)
    .map((part) =>
      part.startsWith('`')
        ? part
        : part.replaceAll(BARE_CLAIM_REF_PATTERN, '[[$1]](#sources)'),
    )
    .join('')
