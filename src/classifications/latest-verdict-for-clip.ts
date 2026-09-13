import type { Clip } from '../clips/clip.ts'
import type { ClassificationVerdict } from './classification-verdict.ts'

/** `normalized_url` first, `clip_id` second - the same precedence the Python
 * `latest` view uses when it keys a row. Returns null when the capture has no
 * verdict at all, which is a real and common case: a clip captured or
 * re-clipped outside a classification run has never been judged, and absence
 * of a verdict must never read as a rejection. */
export const latestVerdictForClip = (
  verdicts: Map<string, ClassificationVerdict>,
  clip: Clip,
): ClassificationVerdict | null =>
  verdicts.get(clip.metadata.normalized_url) ??
  verdicts.get(clip.metadata.clip_id) ??
  null
