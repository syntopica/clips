/** A Medium article page ships its whole rendered body as a normalized Apollo
 * cache in `window.__APOLLO_STATE__ = {...};</script>`, which is the only place
 * the paragraphs exist as data rather than as React markup. The capture is
 * closed by `</script>` instead of by brace balancing because a `<script>` body
 * can never contain a literal `</script>`, so the first one always ends the
 * assignment; the lazy quantifier therefore stops at the right brace even
 * though the JSON is full of nested ones. Not global: a `g` flag would carry
 * `lastIndex` between calls.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const APOLLO_STATE_PATTERN =
  /window\.__APOLLO_STATE__\s*=\s*(\{[\s\S]*?\})\s*(?:;\s*)?<\/script>/
