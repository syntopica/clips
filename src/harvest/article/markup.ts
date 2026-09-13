/** One span of inline formatting inside a Medium paragraph. `start` and `end`
 * are UTF-16 code unit offsets into the paragraph text, half-open `[start,
 * end)` - the same units JavaScript string indexing uses, so no conversion is
 * needed. Measured `type` values on a real article: `STRONG`, `A`, `CODE`.
 * The optional fields spell out `| undefined` because `exactOptionalPropertyTypes`
 * is on and the entries arrive from a parser that emits the key holding
 * `undefined`, not an absent key.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export type Markup = {
  type: string
  start: number
  end: number
  href?: string | null | undefined
  title?: string | null | undefined
  anchorType?: string | null | undefined
}
