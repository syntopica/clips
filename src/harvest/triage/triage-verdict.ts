import type { TriageBucket } from './triage-bucket.ts'
import type { TriageTopicName } from './triage-topic-name.ts'

/** One classifier verdict, before it is joined back to its article. */
export type TriageVerdict = {
  bucket: TriageBucket
  topic: TriageTopicName
  reason: string
}
