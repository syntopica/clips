/** A `$…$` span carrying a LaTeX command, which is inline maths and nothing
 * else.
 *
 * The design is the whole task here. `SCHEMA.md` bans inline `$…$` because
 * GitHub opens inline math at one `$` and closes it at the next, and 349 dollar
 * amounts across 36 pages are already ambiguous under that rule - so a plain
 * `\$[^$]*\$` check would report every one of them and be switched off inside a
 * batch. That is the always-fires failure that killed the earlier hand-edited
 * check, and it is worse than no check.
 *
 * Requiring a LaTeX command inside the span is what makes it specific: `\text`,
 * `\times`, `\frac` and `\sum` appear in maths and never in a price. The span
 * may not cross a `$` or a newline, so a paragraph mentioning two prices cannot
 * be joined into one match, and a `$$…$$` block is skipped by the caller before
 * this ever sees it. */
export const INLINE_MATHS_PATTERN =
  /\$[^$\n]*\\(?:text|times|frac|sum)[^$\n]*\$/
