import type { HarvestedArticle } from './newsletter/harvested-article.ts'
import type { SenderYield } from './newsletter/sender-yield.ts'

/** What one sweep of the requested collectors produced, before classification.
 * `skipped` counts the collectors that were asked for and came back null, which
 * is what makes a partial run distinguishable from a complete one. */
export type HarvestedRun = {
  articles: HarvestedArticle[]
  emailCount: number
  linkCount: number
  /** Whether the newsletter collector was asked for and came back. Only such a
   * run may move the window between sweeps forward. */
  newsletterSwept: boolean
  savedCount: number
  senders: SenderYield[]
  skipped: number
}
