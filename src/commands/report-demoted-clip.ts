import type { ClassificationVerdict } from '../classifications/classification-verdict.ts'
import { demotedVerdictForClip } from '../classifications/demoted-verdict-for-clip.ts'
import type { Clip } from '../clips/clip.ts'

/** Say on stdout that a clip is skipped because its latest verdict demoted it
 * out of the `ingest` bucket, and report whether it was. A clip with no
 * verdict is not demoted: the store only covers what a classification run has
 * seen. */
export const reportDemotedClip = (
  verdicts: Map<string, ClassificationVerdict>,
  clip: Clip,
): boolean => {
  const demoted = demotedVerdictForClip(verdicts, clip)
  if (demoted === null) return false
  process.stdout.write(
    `${clip.metadata.clip_id}: skipped (latest verdict ${demoted.bucket}, ${demoted.run})\n`,
  )
  return true
}
