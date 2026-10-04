/** The `usage` object of a `codex exec --json` `turn.completed` event, as
 * printed: every field unchecked until read. */
export type ReportedTurnUsage = {
  input_tokens?: unknown
  cached_input_tokens?: unknown
  output_tokens?: unknown
  reasoning_output_tokens?: unknown
}
