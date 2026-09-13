/** The text back when it is JSON, null when it is only balanced braces in prose.
 *
 * Its own file because the Primary Unit Rule takes no module-scope helpers, and
 * because keeping the try/catch out of `cursorJsonPayload` leaves that function
 * a brace scanner and nothing else. */
export const parsedJsonText = (candidate: string): string | null => {
  try {
    JSON.parse(candidate)
    return candidate
  } catch {
    return null
  }
}
