/** Any article entry in a triage file, ticked or not: `- [Title](url)` and
 * `- [x] [Title](url)` alike, with the optional first bracket group absorbing
 * the checkbox.
 *
 * The link text is matched as "anything but a closing bracket" so a title
 * carrying parentheses (Medium is full of them) cannot end the match early, and
 * the URL stops at the first `)` or space. `formatTriageEntry` swaps brackets
 * in titles for parentheses, so the bracket exclusion is safe.
 *
 * `vexa://` is accepted alongside `https?://`: a body-content article's
 * identity is the synthetic URL `bodyArticleUrl` builds, and a scheme filter
 * here would silently drop every one of them from promotion. */
export const TRIAGE_ENTRY_PATTERN =
  /^\s*-\s+(?:\[[^\]]*\]\s+)?\[([^\]]*)\]\(((?:https?|vexa):\/\/[^\s)]+)\)/u
