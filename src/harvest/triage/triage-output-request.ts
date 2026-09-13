import type { TriagedArticle } from './triaged-article.ts'

/** Everything one triage run needs on disk: where the wiki lives, which day the
 * run covers, the two counts the index reports, and the classified articles. */
export type TriageOutputRequest = {
  brainRepository: string
  date: string
  emailCount: number
  linkCount: number
  articles: readonly TriagedArticle[]
}
