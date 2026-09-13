import type { ClipBucket } from './clip-bucket.ts'

export const CLIP_BUCKETS: readonly ClipBucket[] = [
  'pending',
  'processed',
  'needs-claude',
]
