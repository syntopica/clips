/** Pull the model's answer out of an `agy --output-format json` envelope.
 *
 * agy wraps the run in `{conversation_id, status, response, structured_output,
 * ...}`. **`structured_output` is the schema-constrained answer**; `response`
 * is the model's prose, and when `--json-schema` is in play it contains the
 * answer's JSON repeated inline among that prose, which does not parse. Reading
 * `response` first was a real defect, found on 2026-08-02 when the agy grader
 * returned "no readable verdict" in fourteen seconds: it affects the triage
 * lane the same way, silently degrading every batch to `review`.
 *
 * Returning a string rather than the parsed object keeps this runner
 * interchangeable with the codex one, which hands back a raw final message.
 *
 * Every malformed shape returns null, which `parseTriageVerdicts` turns into an
 * empty verdict map and the caller turns into "review" for the whole batch. A
 * transport that cannot be read must not silently reject articles. */
export const unwrapAgyResponse = (stdout: string): string | null => {
  let envelope: unknown
  try {
    envelope = JSON.parse(stdout)
  } catch {
    return null
  }
  if (typeof envelope !== 'object' || envelope === null) return null
  const structured = (envelope as { structured_output?: unknown })
    .structured_output
  if (typeof structured === 'object' && structured !== null)
    return JSON.stringify(structured)
  // No schema was enforced, or an older agy: fall back to the prose field,
  // which is a bare JSON string only when the model was asked in the prompt.
  const response = (envelope as { response?: unknown }).response
  if (typeof response === 'string') return response
  if (typeof response === 'object' && response !== null)
    return JSON.stringify(response)
  return null
}
