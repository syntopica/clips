import { existsSync } from 'node:fs'

/** Where a Chrome that can render a page lives, or `null` when none is
 * installed.
 *
 * A browser is the reserve rather than the transport, so its absence is a
 * degradation and never a failure: the caller falls back to the body-less clip
 * it would have written anyway. That is why this returns `null` instead of
 * throwing, and why nothing here installs anything.
 *
 * `CLIPS_HEADLESS_BROWSER` comes first so a machine that keeps Chrome
 * elsewhere - or wants Chromium instead - needs no code change. The default is
 * the macOS path because this lane runs on the Mac, beside the Python transport
 * that already fetches Medium daily.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const headlessBrowserPath = (): string | null => {
  const configured = process.env['CLIPS_HEADLESS_BROWSER']
  if (configured !== undefined && configured !== '')
    return existsSync(configured) ? configured : null

  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  return existsSync(chrome) ? chrome : null
}
