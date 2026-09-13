/** A line with its `code spans` removed.
 *
 * Found by the first live run: [[topics/web-platform]] documents the DevTools
 * console shorthands, and its `` `$$()` `` reported the whole page as an
 * unclosed maths block. A code span is markup the renderer never reads as
 * maths, so the checks must not read it as maths either - the same reason they
 * skip fenced blocks, one nesting level down. */
export const withoutInlineCode = (line: string): string =>
  line.replaceAll(/`[^`]*`/g, '')
