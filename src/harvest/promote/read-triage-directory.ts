import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { parseTickedArticles } from './parse-ticked-articles.ts'
import type { TickedArticle } from './ticked-article.ts'
import type { TriageParser } from './triage-parser.ts'

/** Every tick across one dated triage run, topic taken from the filename stem.
 * `README.md` is the run's index, not a topic, so it is skipped.
 *
 * A missing directory throws rather than returning nothing: the user asked to
 * promote a run that does not exist, and an empty array would read as "you
 * ticked nothing" and silently discard the request.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const readTriageDirectory = (
  directory: string,
  parse: TriageParser = parseTickedArticles,
): TickedArticle[] => {
  if (!existsSync(directory))
    throw new Error(`No triage run at ${directory} - nothing to promote.`)
  return readdirSync(directory)
    .filter(
      (entry) =>
        entry.endsWith('.md') &&
        entry !== 'README.md' &&
        entry !== 'NOT-INGESTED.md',
    )
    .flatMap((entry) =>
      parse(
        readFileSync(join(directory, entry), 'utf8'),
        basename(entry, '.md'),
      ),
    )
}
