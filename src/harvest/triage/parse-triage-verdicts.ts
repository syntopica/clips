import { TriageVerdictSchema } from './triage-verdict-schema.ts'
import type { TriageVerdict } from './triage-verdict.ts'

/** Parse one codex final message into verdicts keyed by article index.
 *
 * A null message (codex died, timed out, was killed) or an unparseable one
 * returns an empty map rather than throwing: the caller turns every unmatched
 * article into a `review` entry, so a failed batch degrades into "the user
 * decides" instead of losing the articles or aborting the whole run. */
export const parseTriageVerdicts = (
  message: string | null,
): Map<number, TriageVerdict> => {
  if (message === null) return new Map()
  let payload: unknown
  try {
    payload = JSON.parse(message)
  } catch {
    return new Map()
  }
  const parsed = TriageVerdictSchema.safeParse(payload)
  if (!parsed.success) return new Map()
  return new Map(
    parsed.data.verdicts.map((verdict) => [
      verdict.id,
      { bucket: verdict.bucket, topic: verdict.topic, reason: verdict.reason },
    ]),
  )
}
