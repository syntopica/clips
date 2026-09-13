import { linesOutsideCodeFences } from './lines-outside-code-fences.ts'
import { withoutInlineCode } from './without-inline-code.ts'

/** How many `$$` delimiters a page carries when that count is odd, or null.
 *
 * An odd count is an unclosed block, and GitHub renders the rest of the page
 * from there as a formula. This is the cheap half of the maths pass: it needs
 * no pattern design, cannot fire on a price, and catches the failure that is
 * expensive to notice by eye because the damage starts below where the mistake
 * is. */
export const pageUnclosedMathsBlock = (page: string): number | null => {
  const delimiters = linesOutsideCodeFences(page).reduce(
    (total, [, line]) =>
      total + (withoutInlineCode(line).match(/\$\$/g) ?? []).length,
    0,
  )
  return delimiters % 2 === 1 ? delimiters : null
}
