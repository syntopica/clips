import type { TickedArticle } from './ticked-article.ts'

/** One dated triage run and the ticks it has still not turned into clips. */
export type UnfetchedRun = {
  date: string
  articles: TickedArticle[]
}
