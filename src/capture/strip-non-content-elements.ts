/** Remove the elements whose text is not text, in place.
 *
 * `document.body.textContent` includes the contents of `<script>` and
 * `<style>`, and the DOM fallbacks reach `innerHTML` for the same nodes. On a
 * page whose markup is mostly inline state that is not a near miss, it is the
 * whole extraction: a YouTube watch page returned 636,918 characters of
 * `ytInitialPlayerResponse` JSON this way, written to a clip as if a container
 * had been found.
 *
 * **Called after Defuddle has parsed, never before.** Its site extractors read
 * exactly these nodes - JSON-LD, `__NEXT_DATA__` and the rest - so stripping
 * them first would take the good extraction away to protect the fallback.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const stripNonContentElements = (document: Document): void => {
  for (const element of document.querySelectorAll(
    'script, style, noscript, template',
  ))
    element.remove()
}
