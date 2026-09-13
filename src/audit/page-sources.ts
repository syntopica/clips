import { sourceEntryValues } from '../grade/source-entry-values.ts'
import { frontmatterListLines } from './frontmatter-list-lines.ts'

/** The raw `sources:` entries in a page's frontmatter, as written.
 *
 * `pageSourceFiles` reads the same field for the grader and keeps only what
 * resolves to a readable file inside the repository. This one keeps everything,
 * because a url is not evidence anything here can open and is still a source
 * with a rank. Same field, two questions - what can be read, and what it is.
 *
 * An entry is its **first token**, not the whole line. Requiring the line to
 * hold nothing else silently dropped every annotated entry - the
 * `- <url> (clipped 2026-07-27, clip_id ...)` shape this wiki writes by hand,
 * which prettier then wraps across lines. 14 of 1,303 entries across 11 pages
 * were invisible that way, and the damage is not the count: a dropped entry
 * shifts the index of every source after it, so `S24` in a 23-source page
 * resolved against a 20-entry list and a marker that was correct became
 * unresolvable. Found 2026-08-08 when an ingest into
 * `topics/claude-skills-ecosystem` was refused for citing the source it had
 * just appended. Continuation lines carry no `-` and are still excluded. */
export const pageSources = (page: string): string[] =>
  sourceEntryValues(frontmatterListLines(page, 'sources'))
