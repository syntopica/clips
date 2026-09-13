import { frontmatterListLines } from '../audit/frontmatter-list-lines.ts'
import { resolveLocalSource } from './resolve-local-source.ts'
import { sourceEntryValues } from './source-entry-values.ts'

/** The repository-local files listed under `sources:` in a page's frontmatter,
 * as absolute paths that exist.
 *
 * Not every source here is a clip. `sources/x/` holds scraped threads,
 * `sources/vault/` the folded archive and `sources/surveys/` schema-enforced
 * reads of an external corpus plus the third-party files a claim rests on. A
 * page may be written from any of them.
 *
 * Until this existed the grader saw only clips, so every claim from a local
 * source read as unsupported - it reported 45 on [[topics/llm-wiki]], of which
 * the great majority were the page correctly citing an X thread and a survey
 * the grader could not open. A grader that cries wolf on a whole class of
 * source is worse than no grader, because the post-ingest loop is meant to act
 * on what it reports.
 *
 * An entry is read up to its first token, for the reason `pageSources` gives:
 * this wiki annotates entries by hand - `- <path> (clipped <date>, clip_id
 * <id>)` - and prettier then wraps them, so requiring the line to hold nothing
 * else dropped the entry entirely. `pageSources` was corrected on 2026-08-08
 * and the two readers of the same field disagreed from then until 2026-08-24;
 * `findUnreadableSources` reports that disagreement now rather than leaving it
 * to be found a third time. */
export const pageSourceFiles = (
  brainRepository: string,
  page: string,
): string[] => {
  const files: string[] = []
  for (const value of sourceEntryValues(
    frontmatterListLines(page, 'sources'),
  )) {
    const resolved = resolveLocalSource(brainRepository, value)
    if (resolved !== null) files.push(resolved)
  }
  return files
}
