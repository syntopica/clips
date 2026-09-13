import { CLAIM_REF_PATTERN } from '../citations/claim-ref-pattern.ts'
import type { ClaimRef } from '../citations/claim-ref.ts'
import { quotedSpans } from '../citations/quoted-spans.ts'
import { pageClaimsText } from '../grade/page-claims-text.ts'
import { withoutFrontmatter } from '../grade/without-frontmatter.ts'
import { linesOutsideCodeFences } from './lines-outside-code-fences.ts'
import type { QuotedClaim } from './quoted-claim.ts'
import { withoutInlineCode } from './without-inline-code.ts'

/** Every quotation on a page that a claim marker attributes to a source.
 *
 * The four exclusions are `pageClaimRefs`', for its reasons: frontmatter and
 * the `## Sources` section assert nothing, and a fenced block or a code span is
 * sample text. A page documenting the convention must not have its examples
 * read as citations.
 *
 * Attribution is to the **first marker to the right of the closing quote on the
 * same line**, because that is where the convention puts a marker - after the
 * claim it supports. A quotation with no marker after it is dropped rather than
 * attributed to the marker before it: an unmarked quotation is one of the 110
 * grandfathered pages' spans, and guessing its source would invent the evidence
 * the check exists to verify. */
export const pageQuotedClaims = (page: string): readonly QuotedClaim[] => {
  const claims: QuotedClaim[] = []
  for (const [, raw] of linesOutsideCodeFences(
    pageClaimsText(withoutFrontmatter(page)),
  )) {
    const line = withoutInlineCode(raw)
    const markers = [...line.matchAll(CLAIM_REF_PATTERN)]
    for (const [end, quote] of quotedSpans(line)) {
      const marker = markers.find((match) => match.index >= end)
      const ref = marker?.[1]
      if (ref !== undefined) claims.push({ quote, ref: ref as ClaimRef })
    }
  }
  return claims
}
