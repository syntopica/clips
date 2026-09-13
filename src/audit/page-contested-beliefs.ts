import { matchContestedBulletLine } from './match-contested-bullet-line.ts'
import { matchContestedContinuationLine } from './match-contested-continuation-line.ts'

/** The entries in a page's `## Contested` section: what this page used to hold,
 * kept rather than overwritten when the belief changed.
 *
 * A body section rather than a frontmatter field, and that is the difference
 * from `contradictions:`. That one holds a disagreement between two sources
 * that is **still open**, one line each, dropped when it settles. This holds a
 * belief of the wiki's own that has already been replaced - it is history, it
 * needs the sentence that explains why the new one outranks, and it is never
 * dropped. Two questions, two shapes.
 *
 * Ends at the next `## ` heading, the way `pageClaimsText` reads the sources
 * section, so a page whose contested section is not last keeps its later
 * prose. A continuation line folds into the entry above it, because an entry
 * long enough to wrap is the normal case here - a superseded belief carries its
 * reason. */
export const pageContestedBeliefs = (page: string): string[] => {
  const lines = page.split('\n')
  const start = lines.findIndex((line) => /^## Contested\s*$/.test(line))
  if (start === -1) return []
  const entries: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) break
    const entry = matchContestedBulletLine(line)
    if (entry !== undefined) {
      entries.push(entry)
      continue
    }
    const continuation = matchContestedContinuationLine(line)
    const previous = entries.at(-1)
    if (continuation !== undefined && previous !== undefined)
      entries[entries.length - 1] = `${previous} ${continuation}`
  }
  return entries
}
