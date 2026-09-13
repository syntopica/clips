/** The index just past the JSON string that opens at `openIndex`, or the text's
 * length if it never closes.
 *
 * Pulled out of `cursorJsonPayload` so the brace scanner there is a scanner
 * over braces and nothing else. Inline, the string state and its escape flag
 * made that function branchy enough to read as if the quoting were the
 * interesting part, when the interesting part is which object is last.
 *
 * `openIndex` addresses the opening quote itself. Escapes are honoured only as
 * far as this needs them - a backslash makes the next character ordinary, which
 * is enough to find the true closing quote without decoding anything. */
export const endOfJsonString = (text: string, openIndex: number): number => {
  for (let index = openIndex + 1; index < text.length; index += 1) {
    if (text[index] === '\\') index += 1
    else if (text[index] === '"') return index + 1
  }
  return text.length
}
