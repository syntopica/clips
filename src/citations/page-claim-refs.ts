import { linesOutsideCodeFences } from '../audit/lines-outside-code-fences.ts'
import { withoutInlineCode } from '../audit/without-inline-code.ts'
import { pageClaimsText } from '../grade/page-claims-text.ts'
import { withoutFrontmatter } from '../grade/without-frontmatter.ts'
import { CLAIM_REF_PATTERN } from './claim-ref-pattern.ts'
import type { ClaimRef } from './claim-ref.ts'

/** Every distinct claim ref a page's prose carries, in first-appearance order.
 *
 * Three exclusions, each already justified where its helper lives.
 * `withoutFrontmatter` and `pageClaimsText` are the pair `gradePrompt` uses:
 * neither the frontmatter block nor the `## Sources` section is a sentence the
 * page asserts, so reading one as a claim invents findings the page does not
 * contain - measured, three of four reported claims on one page were readings
 * of article slugs inside frontmatter urls. `linesOutsideCodeFences` and
 * `withoutInlineCode` are the third and fourth, the pair the maths checks
 * already use one nesting level apart: a marker inside a fence or a code span
 * is sample text. The span half was not assumed - the first live run reported
 * 50 uncited sources on [[topics/llm-wiki]], whose prose describes this very
 * convention in `` `[S1]` ``. A page that documents a marker does not cite one.
 *
 * Distinct rather than every occurrence, because both consumers ask a question
 * about the set - which refs name no source, and which sources no ref names.
 * A count of markers is not a question anything here asks. */
export const pageClaimRefs = (page: string): readonly ClaimRef[] => {
  const prose = linesOutsideCodeFences(pageClaimsText(withoutFrontmatter(page)))
    .map(([, line]) => withoutInlineCode(line))
    .join('\n')
  const refs: ClaimRef[] = []
  for (const [, ref] of prose.matchAll(CLAIM_REF_PATTERN)) {
    const claimRef = ref as ClaimRef
    if (!refs.includes(claimRef)) refs.push(claimRef)
  }
  return refs
}
