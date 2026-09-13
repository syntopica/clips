import { mediumPostId } from './medium-post-id.ts'

/** What two harvested articles must share to be the same article.
 *
 * Keying on the whole normalized URL let one article through twice whenever
 * Medium spelled it two ways, and it recurs on every harvest. Both cases found
 * on 2026-08-02 were real: `medium.com/@shailesh-sharma/...-8b5231d206b7` and
 * `shailesh-sharma.medium.com/...-8b5231d206b7` are the `/@author` and
 * author-subdomain forms of one post promoted in the same run, and
 * `@nitinsgavane/...-24391dcc4203` and `@nitingavhane/...-24391dcc4203` are two
 * spellings of one handle over one post id, re-clipped hours after the first
 * had been ingested.
 *
 * The post id is used whatever the host, because a Medium-hosted publication
 * serves the same post under its own domain. A URL without one - anything the
 * extension clipped from the open web - keeps the whole normalized URL as its
 * key. This is a comparison key only: `metadata.normalized_url` is clip
 * identity and does not move.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const articleDedupKey = (normalizedUrl: string): string =>
  mediumPostId(normalizedUrl) ?? normalizedUrl
