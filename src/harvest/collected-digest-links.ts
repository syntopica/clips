import type { HarvestedArticle } from './newsletter/harvested-article.ts'
import type { SenderYield } from './newsletter/sender-yield.ts'

/** What one newsletter sweep produced: the deduplicated articles, the two
 * counts the deduplication ratio is computed from, and what each sender
 * contributed. */
export type CollectedDigestLinks = {
  articles: HarvestedArticle[]
  emailCount: number
  linkCount: number
  senders: SenderYield[]
}
