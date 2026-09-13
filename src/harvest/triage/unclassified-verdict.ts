import type { TriageVerdict } from './triage-verdict.ts'

/** What an article gets when its batch produced no verdict for it - a dead
 * codex run, a truncated response, an id the model skipped.
 *
 * It lands in `review`, never `rejected`: the same bias rule the classifier
 * itself is given, applied to the classifier's own failures. The reason says
 * plainly that nothing classified it, so the user is not misled into thinking
 * a judgement was made. */
export const UNCLASSIFIED_VERDICT: TriageVerdict = {
  bucket: 'review',
  topic: 'other',
  reason: 'no verdict returned by the classifier',
}
