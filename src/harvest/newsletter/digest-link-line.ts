import { collapseWhitespace } from './collapse-whitespace.ts'

/** One link rendered in the shape the digest extractors read: a markdown link,
 * prefixed by its heading hashes when it carried a level.
 *
 * Whitespace is collapsed here rather than downstream because an HTML title
 * arrives with the source's own line breaks and indentation in it, and
 * `HEADING_LINK_PATTERN` is anchored per line - a title spanning two lines
 * would lose its level and be mistaken for a subtitle.
 *
 * `]` and `\` are escaped because the link patterns read a title as "anything
 * up to the closing bracket", so a title that contains one truncates the match
 * and the article is dropped with no error at all. Measured over the Medium
 * bodies since 2026-01-01: 10 article links lost that way, titles of the
 * `[Free] 12 AI tools...` shape. `digestTitle` removes the escapes on the way
 * back out. */
export const digestLinkLine = (
  level: number | null,
  title: string,
  url: string,
): string => {
  const escaped = collapseWhitespace(title).replaceAll(/[[\]\\]/gu, '\\$&')
  return `${level === null ? '' : `${'#'.repeat(level)} `}[${escaped}](${url})`
}
