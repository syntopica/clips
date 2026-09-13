import type { HarvestedArticle } from '../newsletter/harvested-article.ts'

/** An article paired with its position in the full harvested list. The pairing
 * has to survive batching: a refinement pass classifies a subset, and its
 * verdicts are matched back by that original index, not by where the article
 * landed in the smaller batch. */
export type TriageEntry = { index: number; article: HarvestedArticle }
