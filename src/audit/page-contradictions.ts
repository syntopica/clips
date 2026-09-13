import { frontmatterListLines } from './frontmatter-list-lines.ts'

/** The entries listed under `contradictions:` in a wiki page's frontmatter.
 *
 * Each entry is a line of prose naming what disagrees with what. The field
 * exists so the disagreement is an object the audit can list, not a sentence
 * buried in a paragraph a month later.
 *
 * A continuation line - indented, no dash - folds into the entry above it, the
 * way YAML reads a plain scalar. Without that an entry long enough to wrap
 * would be reported truncated at its first line, and a check that quietly
 * shortens what it reports is worse than one that reports nothing. */
export const pageContradictions = (page: string): string[] => {
  const entries: string[] = []
  for (const line of frontmatterListLines(page, 'contradictions')) {
    const entry = /^\s*-\s*(\S.*)$/.exec(line)?.[1]?.trimEnd()
    if (entry !== undefined) {
      entries.push(entry)
      continue
    }
    const continuation = /^\s+(\S.*)$/.exec(line)?.[1]?.trimEnd()
    const previous = entries.at(-1)
    if (continuation !== undefined && previous !== undefined)
      entries[entries.length - 1] = `${previous} ${continuation}`
  }
  return entries
}
