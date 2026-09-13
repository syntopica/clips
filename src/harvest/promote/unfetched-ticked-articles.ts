import { triageOutputPath } from '../triage/triage-output-path.ts'
import { readTriageDirectory } from './read-triage-directory.ts'
import { selectFreshArticles } from './select-fresh-articles.ts'
import type { TickedArticle } from './ticked-article.ts'

/** The ticks in one dated run that have no clip in the store.
 *
 * Derived rather than recorded, so it cannot drift: the ticks are in the triage
 * files and the clips are on disk, and this is the difference. That is what
 * makes it safe for `clips status` to answer the question a promote run used to
 * answer only in a scrollback - whether anything the user asked for is still
 * missing.
 *
 * An unreadable run yields nothing rather than throwing: `status` reports the
 * whole store, and one malformed directory must not take that report down. */
export const unfetchedTickedArticles = (
  brainRepository: string,
  date: string,
  clippedKeys: ReadonlySet<string>,
): TickedArticle[] => {
  try {
    return selectFreshArticles(
      readTriageDirectory(triageOutputPath(brainRepository, date)),
      clippedKeys,
    )
  } catch {
    return []
  }
}
