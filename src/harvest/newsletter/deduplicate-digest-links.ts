import { articleDedupKey } from './article-dedup-key.ts'
import type { DatedDigestLink } from './dated-digest-link.ts'
import type { HarvestedArticle } from './harvested-article.ts'
import { prefersTitle } from './prefers-title.ts'

/** Dedup is the first and cheapest of the three filters, so the expensive fetch
 * sees the smallest set: 4863 links from 186 emails collapsed to 1471 articles.
 * Digest recommendations repeat heavily across days, and within one digest an
 * article appears as both a title link and a subtitle link - `prefersTitle`
 * decides which survives. The key is the article's, not the URL's, so the
 * `/@author` and author-subdomain spellings of one post collapse here rather
 * than becoming two clips; the first spelling seen is the one carried forward.
 * The earliest date is kept as `firstSeen`, with the sender of that first
 * sighting.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const deduplicateDigestLinks = (
  links: DatedDigestLink[],
): HarvestedArticle[] => {
  const byKey = new Map<
    string,
    HarvestedArticle & { headingLevel: number | null }
  >()
  for (const link of links) {
    const key = articleDedupKey(link.url)
    const seen = byKey.get(key)
    if (!seen) {
      byKey.set(key, {
        url: link.url,
        title: link.title,
        headingLevel: link.headingLevel,
        firstSeen: link.date,
        sender: link.sender,
        count: 1,
      })
      continue
    }
    seen.count += 1
    if (prefersTitle(link, seen)) {
      seen.title = link.title
      seen.headingLevel = link.headingLevel
    }
    if (link.date < seen.firstSeen) {
      seen.firstSeen = link.date
      seen.sender = link.sender
    }
  }
  return [...byKey.values()]
    .map(({ headingLevel: _unused, ...article }) => article)
    .sort((left, right) => right.firstSeen.localeCompare(left.firstSeen))
}
