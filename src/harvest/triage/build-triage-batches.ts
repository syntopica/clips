import type { HarvestedArticle } from '../newsletter/harvested-article.ts'
import { buildIndexedTriageBatches } from './build-indexed-triage-batches.ts'

/** Slice the whole harvest into TSV batches, each line
 * `<index><TAB><title><TAB><slug words>`. Every article's index is its position
 * in this list, which is what makes a batch self-describing; the line format
 * and the slicing both live in `buildIndexedTriageBatches`, which the
 * refinement pass reuses over a subset. */
export const buildTriageBatches = (
  articles: readonly HarvestedArticle[],
): string[] =>
  buildIndexedTriageBatches(
    articles.map((article, index) => ({ index, article })),
  )
