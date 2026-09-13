/** The output contract, spelled out because Cursor cannot be handed a schema.
 *
 * `cursor-agent` has no `--output-schema`, so the five required keys of
 * `GRADE_OUTPUT_SCHEMA` have to be stated in the prompt or the model answers
 * with the three the instructions mention and `parseGradeOutput` returns null.
 * That failure is silent in the worst way available here - a page reported as
 * ungraded when the grader had in fact read it and found things.
 *
 * Appended to `inlineGradePrompt` rather than merged into it: that prompt is
 * shared with the agy lane, where the schema flag already enforces this and a
 * restatement would be duplication that can drift. Here it is the only thing
 * standing behind the contract.
 *
 * The fence clause is not decoration. A model asked for JSON in prose wraps it
 * in ```json about as often as not, and `JSON.parse` of a fenced block throws,
 * which arrives as the same silent "not graded". Measured clean on
 * `claude-opus-5-thinking-high` with this sentence present, and again on
 * `cursor-grok-4.6-high` when the lane moved to Cursor's own models. */
export const CURSOR_SCHEMA_INSTRUCTION = `

Respond with ONLY a single JSON object. No prose before or after it, and no
markdown code fences of any kind. It must have exactly these five keys, all of
them present even when empty:

- "unsupported": array of {"claim": string, "why": string}
- "uncheckable": array of strings
- "misattributed": array of {"claim": string, "marker": string, "shouldBe": string or null, "why": string}
- "summary": string
- "verdict": "clean" or "unsupported"`
