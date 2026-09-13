import { collapseWhitespace } from './collapse-whitespace.ts'

/** An article title as it should be read back out of a digest line: the
 * backslash escapes `digestLinkLine` put in removed, and the source's own line
 * breaks collapsed.
 *
 * Used by both readers, and it has to be both: `headingLevels` keys its index
 * on the title, so a title normalized one way there and another way in
 * `extractDigestLinks` would never match its own heading and would lose the
 * level that separates a title from its subtitle. */
export const digestTitle = (raw: string): string =>
  collapseWhitespace(raw.replaceAll(/\\(.)/gu, '$1'))
