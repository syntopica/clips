import type { TriageBucket } from './triage-bucket.ts'
import type { TriageTopicName } from './triage-topic-name.ts'

/** A harvested article after classification: the article itself plus the
 * verdict the classifier returned for it. */
export type TriagedArticle = {
  url: string
  title: string
  firstSeen: string
  bucket: TriageBucket
  topic: TriageTopicName
  reason: string
}
