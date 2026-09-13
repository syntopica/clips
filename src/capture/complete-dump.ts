/** The document a failed browser run had already printed, or `null` when it
 * printed no whole one.
 *
 * `--dump-dom` serializes the document in a single write at the end, so
 * partial output means the browser died mid-render and anything it managed is
 * not the page. The closing tag is what separates the two, and it is checked
 * rather than assumed because the difference decides whether a capture becomes
 * a clip or a body-less one.
 *
 * This exists for full Chrome, which prints and then never exits; see
 * `render-page.ts` for the measurement. A browser killed before it printed
 * still throws, as it should.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const completeDump = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null) return null
  const { stdout } = error as { stdout?: unknown }
  if (typeof stdout !== 'string') return null
  return stdout.trimEnd().endsWith('</html>') ? stdout : null
}
