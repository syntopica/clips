/** One ticked triage line: `- [x] [Title](url) - reason`. The link text is
 * matched as "anything but a closing bracket" so a title carrying parentheses
 * (Medium is full of them) cannot end the match early, and the URL stops at the
 * first `)` or space. `formatTriageEntry` swaps brackets in titles for
 * parentheses, so the bracket exclusion is safe.
 *
 * Lives in its own file because `code-policy/no-hidden-top-level-declarations`
 * makes a non-exported module-scope constant an error (precedent:
 * `src/clips/ulid-pattern.ts`).
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const TICKED_ENTRY_PATTERN = /^\s*-\s+\[X\]\s+\[([^\]]*)\]\(([^\s)]+)\)/i
