import type { ClassificationVerdict } from '../classifications/classification-verdict.ts'
import type { DerivedState } from '../state/derived-state.ts'

/** What a real run would do next, for one clip, as a printable suffix. Only a
 * pending clip has a next step at all, and a demoted verdict wins over the
 * route because `ingestClips` skips before it routes - the dry run has to say
 * what the run would do, or it is not a dry run. */
export const dryRunSuffix = (
  state: DerivedState,
  demoted: ClassificationVerdict | null,
  route: string,
): string => {
  if (state !== 'pending') return ''
  if (demoted !== null)
    return ` -> would skip (latest verdict ${demoted.bucket}, ${demoted.run})`
  return ` -> would route ${route}`
}
