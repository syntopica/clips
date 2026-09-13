import type { ClipBucket } from '../clips/clip-bucket.ts'

export type StageClipMoveInput = {
  clipsRepository: string
  clipDirectory: string
  sourceBucket: ClipBucket
  destinationBucket: ClipBucket
  /** The exact bytes state.json must hold after the move. */
  state: string
}
