import { articleDedupKey } from '../newsletter/article-dedup-key.ts'
import { normalizeArticleUrl } from '../newsletter/normalize-article-url.ts'
import type { TickedArticle } from './ticked-article.ts'

/** The ticked articles that are not in the clip store yet, in tick order.
 *
 * Exists because Medium 403s are intermittent, so a promote run can fail
 * partway and be rerun: without this filter the retry re-fetched every ticked
 * article and wrote duplicate clip directories differing only in ULID (hit on
 * the 2026-07-29 batch: run 1 wrote 15 of 17, the retry duplicated 11).
 * Comparison is on dedup keys, which also collapses the same article ticked in
 * two topic files and the same post ticked under two URL spellings.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const selectFreshArticles = (
  ticked: readonly TickedArticle[],
  clippedKeys: ReadonlySet<string>,
): TickedArticle[] => {
  const seen = new Set(clippedKeys)
  const fresh: TickedArticle[] = []
  for (const article of ticked) {
    const key = articleDedupKey(normalizeArticleUrl(article.url))
    if (seen.has(key)) continue
    seen.add(key)
    fresh.push(article)
  }
  return fresh
}
