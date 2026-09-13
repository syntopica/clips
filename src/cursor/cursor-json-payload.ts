import { endOfJsonString } from './end-of-json-string.ts'
import { parsedJsonText } from './parsed-json-text.ts'

/** The JSON object buried in a Cursor answer, or null when there is none.
 *
 * Cursor has no `--output-schema`, so the contract is asked for in the prompt,
 * and in tool-using mode the model narrates before honouring it. Measured
 * 2026-09-11 on the first real synthesis run, whose `result` field read:
 *
 *     Using the `brain` skill to synthesize this clip ... then return the
 *     required JSON.{"pages_touched":["topics/claude-code-configuration.md"],...}
 *
 * The page had been written correctly. `JSON.parse` on that string throws, the
 * clip routed to needs-claude as `PROMPT_OUTPUT_INVALID`, and because the
 * message was non-null the failure tail was empty - so a completely successful
 * synthesis reported as an unexplained transport failure. Strengthening the
 * prompt is not enough on its own: narrating before a final answer is what a
 * tool-using agent does, and a contract that holds only while the model stays
 * disciplined is not a contract.
 *
 * The **last** balanced object is taken rather than the first, because the
 * narration quotes paths and shapes of its own while the contract object is by
 * construction the final thing said. Strings are skipped whole, so a brace
 * inside a page title cannot unbalance the scan, and a candidate is returned
 * only if it parses - this hands back text and leaves the caller's schema to
 * decide whether it is the right shape. */
export const cursorJsonPayload = (text: string): string | null => {
  let depth = 0
  let start = -1
  let last: string | null = null
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      index = endOfJsonString(text, index) - 1
    } else if (character === '{') {
      if (depth === 0) start = index
      depth += 1
    } else if (character === '}' && depth > 0) {
      depth -= 1
      if (depth === 0)
        last = parsedJsonText(text.slice(start, index + 1)) ?? last
    }
  }
  return last
}
