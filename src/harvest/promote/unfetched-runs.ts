import { triageRunDates } from './triage-run-dates.ts'
import type { UnfetchedRun } from './unfetched-run.ts'
import { unfetchedTickedArticles } from './unfetched-ticked-articles.ts'

/** Every dated triage run that still has ticks with no clip, newest first.
 *
 * Runs where everything landed are dropped rather than listed at zero: the
 * report exists to name what is outstanding, and a wall of satisfied runs is
 * how a real gap gets skimmed past. */
export const unfetchedRuns = async (
  brainRepository: string,
  clippedKeys: ReadonlySet<string>,
): Promise<UnfetchedRun[]> =>
  (await triageRunDates(brainRepository))
    .map((date) => ({
      date,
      articles: unfetchedTickedArticles(brainRepository, date, clippedKeys),
    }))
    .filter((run) => run.articles.length > 0)
