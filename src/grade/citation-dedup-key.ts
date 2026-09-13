import { articleDedupKey } from '../harvest/newsletter/article-dedup-key.ts'
import { normalizeArticleUrl } from '../harvest/newsletter/normalize-article-url.ts'

/** The dedup key for a url as a page wrote it, rather than as a clip stored it.
 *
 * A clip's `normalized_url` has been through `normalizeArticleUrl`; a page's
 * `sources:` entry is whatever the author pasted. Keying the two sides
 * differently means a trailing slash decides whether evidence on disk counts as
 * present - measured 2026-08-04, that one character accounted for **eight of
 * the ten** citations `clips audit` still called unresolved after every one of
 * them had been captured and drained.
 *
 * A `sources:` entry that is not a URL at all - a repository path, the several
 * `<vault>/...` provenance lines the fold left behind - cannot be normalized
 * and is keyed verbatim, which is what it was doing before. */
export const citationDedupKey = (sourceUrl: string): string => {
  try {
    return articleDedupKey(normalizeArticleUrl(sourceUrl))
  } catch {
    return articleDedupKey(sourceUrl)
  }
}
