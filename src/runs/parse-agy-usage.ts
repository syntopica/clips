import { finiteCountOrNull } from './finite-count-or-null.ts'
import type { ReportedAgyUsage } from './reported-agy-usage.ts'
import type { RunUsage } from './run-usage.ts'

/** The token counts in an `agy --output-format json` envelope. Probed on
 * 2026-10-04: the envelope carries `usage` with `input_tokens`,
 * `output_tokens`, `thinking_tokens`, `cache_read_tokens` and `total_tokens`.
 * Null for any envelope without both input and output counts. */
export const parseAgyUsage = (stdout: string): RunUsage | null => {
  let envelope: unknown
  try {
    envelope = JSON.parse(stdout)
  } catch {
    return null
  }
  if (typeof envelope !== 'object' || envelope === null) return null
  const usage = (envelope as { usage?: unknown }).usage
  if (typeof usage !== 'object' || usage === null) return null
  const reported = usage as ReportedAgyUsage
  const inputTokens = finiteCountOrNull(reported.input_tokens)
  const outputTokens = finiteCountOrNull(reported.output_tokens)
  if (inputTokens === null || outputTokens === null) return null
  return {
    inputTokens,
    outputTokens,
    cachedInputTokens: finiteCountOrNull(reported.cache_read_tokens),
    reasoningTokens: finiteCountOrNull(reported.thinking_tokens),
  }
}
