import type { ClaimRef } from '../citations/claim-ref.ts'

/** A quotation in a page's prose together with the source its marker attributes
 * it to. Flat because grounding asks one question of each pair - does this text
 * appear in that source - and a page's quotations share nothing else. */
export type QuotedClaim = {
  quote: string
  ref: ClaimRef
}
