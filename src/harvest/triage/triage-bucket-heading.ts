import type { TriageBucket } from './triage-bucket.ts'

/** Section headings in a triage file. `review` says what it wants from the
 * reader, because that section is the only one that asks for anything. */
export const triageBucketHeading = (bucket: TriageBucket): string => {
  if (bucket === 'ingest') return 'Ingest'
  if (bucket === 'review') return 'Review - needs your call'
  return 'Rejected'
}
