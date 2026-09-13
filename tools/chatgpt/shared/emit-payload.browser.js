/* Results leave through a vault the keeper drains over chrome-cli, not
 * through a browser download.
 *
 * Downloads were the obvious transport and they silently stopped working:
 * after the first one, Chrome gates further programmatic downloads from a
 * page behind an "allow multiple downloads" permission, and a blocked
 * `link.click()` throws nothing. On 2026-08-22 the collector reported 76
 * conversations fetched and 10 parts written while exactly one part had
 * reached disk - the other 66 had been cleared from the buffer on a flush
 * that only appeared to succeed. A transport whose failure looks identical
 * to success is worse than a slow one.
 *
 * So a flush parks its payload here and nothing clears it but the drainer,
 * which writes the file first and drops the entry after. `JSON.stringify`
 * output has no literal newlines, so a slice is always a single line the
 * AppleEvent bridge carries intact - measured good to 120KB, read at 100. */

/** Emit payload in the page runtime. */
export function emitPayload(context, name, payload) {
  window.__cgVault.push({ name: name, json: JSON.stringify(payload) })
}
