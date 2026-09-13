import { QUOTATION_WORD_FLOOR } from './quotation-word-floor.ts'

/** The quotations on a line, as `[endOffset, text]`, long enough to be worth
 * grounding.
 *
 * Straight and curly pairs both count. The wiki's own text hygiene rule asks
 * for straight quotes, but a span copied out of a captured article arrives with
 * whatever the publisher used, and a quotation this cannot see is a quotation
 * nothing checks.
 *
 * The offset is where the closing quote sits, because the caller's next
 * question is which claim marker this span belongs to and the convention puts
 * the marker after the claim. Returning the text alone would make that
 * unanswerable on a line carrying two quotations and two markers. */
export const quotedSpans = (
  line: string,
): readonly (readonly [number, string])[] => {
  const spans: (readonly [number, string])[] = []
  for (const match of line.matchAll(/"([^"\n]+)"|“([^”\n]+)”/g)) {
    const quote = match[1] ?? match[2]
    if (quote === undefined) continue
    if (quote.trim().split(/\s+/).length < QUOTATION_WORD_FLOOR) continue
    spans.push([match.index + match[0].length, quote])
  }
  return spans
}
