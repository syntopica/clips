import type { TickedArticle } from './ticked-article.ts'

/** A whole promotion batch: the same jar and clock every article in the run
 * shares, plus the two repository roots. */
export type PromoteArticlesInput = {
  articles: readonly TickedArticle[]
  /** The lane every article in this batch came from. */
  clippedFrom: string
  cookies: Map<string, string>
  clipsRepository: string
  brainRepository: string
  now: Date
}
