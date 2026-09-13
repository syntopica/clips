/** Any triage entry line, ticked or not: a bullet whose first bracket group
 * opens a markdown link. Matches both `- [Title](url)` and
 * `- [ ] [Title](url)`. The `]` is escaped because the `u` flag rejects a lone
 * closing bracket. */
export const TICKED_OR_UNTICKED_PATTERN =
  /^\s*-\s+(?:\[[ Xx]\]\s+)?\[[^\]]*\]\(https?:/gmu
