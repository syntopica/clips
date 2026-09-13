import type { TRIAGE_TOPICS } from './triage-topic.ts'

/** One member of `TRIAGE_TOPICS`. */
export type TriageTopicName = (typeof TRIAGE_TOPICS)[number]
