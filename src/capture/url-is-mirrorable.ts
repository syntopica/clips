/** Whether a clip identity is one the capture service can hold.
 *
 * The service is keyed on normalised web URLs, so a body-content clip's
 * `vexa://<domain>/<local>/<slug>` identity has no row to mirror into -
 * `POST /api/capture` answers 400 and the warning reads like a failure when
 * nothing was ever going to work. Skipping here keeps triage dedup for those
 * senders on the clip store alone, which is the documented state of that lane.
 * SPEC: ~/p/wiki/docs/superpowers/specs/2026-08-04-clip-state-in-the-browser-design.md */
export const urlIsMirrorable = (url: string): boolean =>
  url.startsWith('https://') || url.startsWith('http://')
