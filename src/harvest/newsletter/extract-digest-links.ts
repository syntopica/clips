import type { DigestLink } from './digest-link.ts'
import { digestTitle } from './digest-title.ts'
import { hasMediumPostId } from './has-medium-post-id.ts'
import { headingLevels } from './heading-levels.ts'
import { isBoilerplateLink } from './is-boilerplate-link.ts'
import { MARKDOWN_LINK_PATTERN } from './markdown-link-pattern.ts'
import { normalizeArticleUrl } from './normalize-article-url.ts'

/** Duplicates stay: each article appears twice per digest, once as a title link
 * and once as a subtitle link, and collapsing them is the dedup stage's job.
 *
 * Headings are indexed first so each link carries the level it appeared under -
 * see `headingLevels` for why that index is keyed on url **and** title.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const extractDigestLinks = (body: string): DigestLink[] => {
  const levels = headingLevels(body)
  const links: DigestLink[] = []
  for (const [, rawTitle, rawUrl] of body.matchAll(MARKDOWN_LINK_PATTERN)) {
    if (rawTitle === undefined || rawUrl === undefined) continue
    const url = normalizeArticleUrl(rawUrl)
    if (isBoilerplateLink(url) || !hasMediumPostId(url)) continue
    const title = digestTitle(rawTitle)
    links.push({
      url,
      title,
      headingLevel: levels.get(`${url} ${title}`) ?? null,
    })
  }
  return links
}
