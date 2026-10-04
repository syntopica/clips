/** The `usage` object of an `agy --output-format json` envelope, as printed:
 * every field unchecked until read. */
export type ReportedAgyUsage = {
  input_tokens?: unknown
  output_tokens?: unknown
  thinking_tokens?: unknown
  cache_read_tokens?: unknown
}
