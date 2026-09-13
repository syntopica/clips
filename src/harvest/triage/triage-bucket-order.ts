import type { TriageBucket } from './triage-bucket.ts'

/** Section order in a triage file: what was taken, what needs a decision, what
 * was dropped. The decision the user has to make sits in the middle rather
 * than at the end, where a long rejected list would bury it. */
export const TRIAGE_BUCKET_ORDER: readonly TriageBucket[] = [
  'ingest',
  'review',
  'rejected',
]
