import type { ClipBucket } from './clip-bucket.ts'
import type { ClipMetadata } from './clip-metadata.ts'
import type { ClipState } from './clip-state.ts'

export type Clip = {
  kind: 'clip'
  directory: string
  bucket: ClipBucket
  metadata: ClipMetadata
  state: ClipState
}
