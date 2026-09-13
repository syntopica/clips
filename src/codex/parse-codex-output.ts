import type { SynthesizedVerdict } from '../synthesis/synthesized-verdict.ts'
import { CodexFinalMessageSchema } from './codex-final-message-schema.ts'

/** Maps codex's schema-constrained final message onto the model's own verdict,
 * or null when the message is missing or malformed - the caller escalates that
 * as PROMPT_OUTPUT_INVALID rather than guessing. The transport adds its
 * identity; the model is not asked which model it is. */
export const parseCodexOutput = (
  lastMessage: string | null,
): SynthesizedVerdict | null => {
  if (lastMessage === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(lastMessage)
  } catch {
    return null
  }
  const output = CodexFinalMessageSchema.safeParse(parsed)
  if (!output.success) return null
  return {
    pagesTouched: output.data.pages_touched,
    needsClaude: output.data.needs_claude,
    skipped: false,
    reason: output.data.reason,
  }
}
