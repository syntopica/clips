import type { ClipBucket } from '../clips/clip-bucket.ts'

/** `sourceBucket` is named rather than assumed. It was `pending` implicitly
 * until `clips requeue` needed the move to run the other way, and an implicit
 * source in a function that rewrites paths is the kind of assumption that
 * silently moves the wrong directory once a second caller exists. */
export type MoveClipInput = {
  clipsRepository: string
  clipDirectory: string
  sourceBucket: ClipBucket
  destinationBucket: ClipBucket
  state: string
  subject: string
}
