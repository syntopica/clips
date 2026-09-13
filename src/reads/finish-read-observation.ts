import { pageAtimes } from './page-atimes.ts'
import type { PagesRead } from './pages-read.ts'
import type { ReadObservation } from './read-observation.ts'

/** The pages whose access time advanced while the synthesizer ran, sorted.
 *
 * It observes the transport rather than asking it, and that is the reason it
 * exists: a model reporting its own reads is the author verifying itself, which
 * is the arrangement the grade pass was built to prevent. `pagesTouched` is
 * already a self-report and there is no second one worth having.
 *
 * A page absent from the baseline is one the run created, so it is never
 * counted as read - what it wrote is `pagesTouched`.
 *
 * What this cannot separate is another process reading the same worktree. A
 * backup pass or a desktop search indexer appears here as a read, so the list
 * is evidence about what informed a page and not proof of it. */
export const finishReadObservation = async (
  worktree: string,
  observation: ReadObservation,
): Promise<PagesRead> => {
  if (!observation.observable) return 'unobservable'
  const after = await pageAtimes(worktree)
  const read: string[] = []
  for (const [path, atime] of after)
    if (atime > (observation.baseline.get(path) ?? atime)) read.push(path)
  return read.sort()
}
