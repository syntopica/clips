/** Token counts a synthesis transport reported for one run. Counts only: the
 * prompt and the answer are content and are never kept beside them. A field
 * the transport does not report is null rather than zero. */
export type RunUsage = {
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number | null
  reasoningTokens: number | null
}
