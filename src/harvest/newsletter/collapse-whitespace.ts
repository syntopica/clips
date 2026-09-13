/** A digest link title arrives wrapped across lines, so the same title reads as
 * two different strings until its runs of whitespace collapse to one space.
 * Both the heading index and the link list key on the result, so they have to
 * normalize identically - hence one function rather than two call sites. */
export const collapseWhitespace = (value: string): string =>
  value.replaceAll(/\s+/gu, ' ').trim()
