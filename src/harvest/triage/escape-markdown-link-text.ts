/** Square brackets in an article title would close the markdown link early and
 * leave the URL as visible text. Medium titles do contain them (`[Part 1]`,
 * `[2026]`), so they are swapped for parentheses rather than escaped: the
 * triage files are read by a human, and a backslash run reads worse than a
 * parenthesis. */
export const escapeMarkdownLinkText = (title: string): string =>
  title.replaceAll('[', '(').replaceAll(']', ')')
