import type { TickedArticle } from './ticked-article.ts'

/** The clock and the cookie jar are passed in rather than read inside: the jar
 * is opened once per promotion run instead of once per article, and the clock
 * comes from the caller so every clip in one run shares a capture timestamp. */
export type PromoteArticleInput = {
  article: TickedArticle
  /** What `clipped_from` records for this clip: the lane that captured it. */
  clippedFrom: string
  cookies: Map<string, string>
  clipsRepository: string
  /** Where `tools/capture/` lives, so assets can be fetched at capture time. */
  brainRepository: string
  now: Date
}
