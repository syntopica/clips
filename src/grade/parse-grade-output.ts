import { GradeFinalMessageSchema } from './grade-final-message-schema.ts'
import type { GradeResult } from './grade-result.ts'

/** Maps the grader's schema-constrained final message onto GradeResult, or null
 * when the message is missing or malformed. Null is not "clean": the caller
 * reports the run as failed, because a grader whose output could not be read
 * has graded nothing. */
export const parseGradeOutput = (
  lastMessage: string | null,
): GradeResult | null => {
  if (lastMessage === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(lastMessage)
  } catch {
    return null
  }
  const output = GradeFinalMessageSchema.safeParse(parsed)
  if (!output.success) return null
  return {
    unsupported: output.data.unsupported,
    uncheckable: output.data.uncheckable,
    misattributed: output.data.misattributed,
    summary: output.data.summary,
    verdict: output.data.verdict,
  }
}
