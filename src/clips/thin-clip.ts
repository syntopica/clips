import type { ClipBucket } from './clip-bucket.ts'

/** A directory under clips/ that is not a readable version-1 clip: the mobile
 * Shortcut's index.md-only capture, or a future schema version. It is reported
 * and never processed. Normalisation is plan 2d. */
export type ThinClip = {
  kind: 'thin'
  directory: string
  bucket: ClipBucket
  reason: string
}
