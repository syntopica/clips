import type { TickedArticle } from './ticked-article.ts'
import { TRIAGE_ENTRY_PATTERN } from './triage-entry-pattern.ts'

/** Every article entry in one topic file, whatever bucket it sits in and
 * whether or not it is ticked.
 *
 * `parseTickedArticles` reads a tick as an instruction, which is right when the
 * question is "what does the user want ingested". This reads the file as a list
 * of URLs, which is right when the question is "what should be on disk" -
 * capture is not a judgement (SPEC:
 * docs/superpowers/specs/2026-07-30-capture-first-pipeline-design.md).
 *
 * Two shapes appear in the triage output and both count, because missing the
 * second is exactly how 327 rejected entries were silently dropped once
 * already:
 *
 *     - [x] [Title](url) - reason      a marked line
 *     - [Title](url) - reason          an unmarked line
 *
 * `[gone-410]` lines are skipped: the article is known deleted upstream, and
 * re-requesting it wastes a round trip per run forever. */
export const parseAllArticles = (
  markdown: string,
  topic: string,
): TickedArticle[] => {
  const articles: TickedArticle[] = []
  for (const line of markdown.split('\n')) {
    if (line.includes('[gone-410]')) continue
    const match = TRIAGE_ENTRY_PATTERN.exec(line)
    const title = match?.[1]
    const url = match?.[2]
    if (title === undefined || url === undefined) continue
    articles.push({ url, title, topic })
  }
  return articles
}
