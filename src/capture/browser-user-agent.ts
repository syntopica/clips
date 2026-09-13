/** The User-Agent every general page fetch sends.
 *
 * A real browser string rather than a polite bot identifier, and the reason is
 * measured rather than cosmetic: with this one, Python's TLS stack got 200 from
 * hosts that answered Node's `fetch` with 403. A capture that fails is a capture
 * lost, and this lane exists to keep pages the owner chose to read.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
