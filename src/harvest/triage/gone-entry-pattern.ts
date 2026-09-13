/** One `[gone-410]` triage line: the operator's record that the article was
 * deleted upstream. The capture group is the URL, which is the identity the
 * marker must survive on - a harvest re-run rewrites every topic file, and
 * before 2026-08-21 the rewrite dropped these markers, so the next promote
 * retried known-dead URLs.
 *
 * Lives in its own file because `code-policy/no-hidden-top-level-declarations`
 * makes a non-exported module-scope constant an error (precedent:
 * `src/harvest/promote/ticked-entry-pattern.ts`). */
export const GONE_ENTRY_PATTERN = /\[gone-410\]\s+\[[^\]]*\]\(([^\s)]+)\)/g
