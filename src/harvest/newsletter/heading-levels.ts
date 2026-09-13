import { digestTitle } from './digest-title.ts'
import { HEADING_LINK_PATTERN } from './heading-link-pattern.ts'
import { normalizeArticleUrl } from './normalize-article-url.ts'

/** Index every link that appeared inside a heading by `url + title`, keeping the
 * shallowest level when one appears more than once.
 *
 * The key carries the title on purpose, never the url alone: the title and
 * subtitle forms of an article share a URL, so a per-URL level would give both
 * the same value and hand the decision straight back to length. Measured over
 * eight digests, 86 articles carried both forms and in 19 of them (22%) the
 * subtitle was the longer string.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const headingLevels = (body: string): Map<string, number> => {
  const levels = new Map<string, number>()
  for (const [, hashes, title, rawUrl] of body.matchAll(HEADING_LINK_PATTERN)) {
    if (hashes === undefined || title === undefined || rawUrl === undefined)
      continue
    const key = `${normalizeArticleUrl(rawUrl)} ${digestTitle(title)}`
    const seen = levels.get(key)
    if (seen === undefined || hashes.length < seen)
      levels.set(key, hashes.length)
  }
  return levels
}
