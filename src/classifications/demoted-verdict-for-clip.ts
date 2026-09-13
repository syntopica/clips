import type { Clip } from '../clips/clip.ts'
import type { ClassificationVerdict } from './classification-verdict.ts'
import { isOwnerTickedCapture } from './is-owner-ticked-capture.ts'
import { latestVerdictForClip } from './latest-verdict-for-clip.ts'

/** The clip's latest verdict when it is one that should stop an ingest, and
 * null otherwise. Null covers both "never classified" and "still in the ingest
 * bucket", because neither is a reason to skip - a capture the classifier has
 * never seen must not be treated as rejected.
 *
 * A capture the owner ticked is never demoted. Every verdict in the store is a
 * model's - each row carries the model that wrote it - and SCHEMA's source
 * authority order puts the owner's own knowledge above all of them, **never by
 * recency**. That order was adopted on 2026-08-03 naming this exact case: clip
 * `01KYSGC20YAHW2M8HXXG3FBK8S` was ticked in the rejected bucket and then
 * skipped here because a later full-text run filed it `read-no-value`.
 *
 * The check does not become decoration. It demotes what nobody ticked, which is
 * where a re-classification is the only judgement a capture has ever had, and
 * that is the population the capture-first design is growing: capture first,
 * classify after. It is thin today only because the harvest still promotes
 * ticks alone. */
export const demotedVerdictForClip = (
  verdicts: Map<string, ClassificationVerdict>,
  clip: Clip,
): ClassificationVerdict | null => {
  if (isOwnerTickedCapture(clip)) return null
  const verdict = latestVerdictForClip(verdicts, clip)
  if (verdict === null || verdict.bucket === 'ingest') return null
  return verdict
}
