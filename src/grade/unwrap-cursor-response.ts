/** Pull the model's answer out of a `cursor-agent --output-format json`
 * envelope.
 *
 * Cursor wraps the run in `{type, subtype, is_error, result, session_id,
 * usage, ...}`, where `result` is the model's text and there is no
 * schema-constrained field beside it - the CLI has no `--output-schema`, which
 * is the one capability codex and agy both have and this transport does not.
 * So the shape the grade lane needs is asked for in the prompt and arrives as
 * the prose field, and `cursorSchemaInstruction` is what makes that reliable.
 *
 * `is_error` is read rather than trusted to coincide with the exit code: a run
 * that failed mid-turn still exits 0 and still carries a `result`, and taking
 * that text as a verdict would report a transport failure as a graded page.
 *
 * Every malformed shape returns null, which the caller reports as a page that
 * could not be graded - never as a clean one. */
export const unwrapCursorResponse = (stdout: string): string | null => {
  let envelope: unknown
  try {
    envelope = JSON.parse(stdout)
  } catch {
    return null
  }
  if (typeof envelope !== 'object' || envelope === null) return null
  if ((envelope as { is_error?: unknown }).is_error === true) return null
  const result = (envelope as { result?: unknown }).result
  return typeof result === 'string' ? result : null
}
