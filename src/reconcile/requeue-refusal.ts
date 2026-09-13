import type { Clip } from '../clips/clip.ts'
import { parseStructuredFailure } from './parse-structured-failure.ts'
import { RETRYABLE_FAILURE_CODES } from './retryable-failure-codes.ts'

/** Why this clip may not be requeued, or null when it may be.
 *
 * The whole point of the command is that it reads `failure` rather than
 * requeueing anything it is handed: a clip escalated by a transport failure and
 * one escalated for sensitivity are parked in the same bucket, and only the
 * first is a retry. An unreadable or unrecognised failure refuses too - a clip
 * nobody can explain is not evidence that a re-run is safe. */
export const requeueRefusal = (clip: Clip): string | null => {
  if (clip.bucket !== 'needs-claude')
    return `it is in ${clip.bucket}, and requeue only moves clips out of needs-claude`
  const failure = parseStructuredFailure(clip.state.failure)
  if (failure === null)
    return 'its failure is missing or not in the structured form, so there is nothing to decide from; move it by hand if a re-run is really what you want'
  if (!RETRYABLE_FAILURE_CODES.includes(failure.code))
    return `${failure.code} is not a transport failure a re-run clears (${failure.message})`
  return null
}
