import type { CapturedPage } from './captured-page.ts'
import { extractPage } from './extract-page.ts'
import { extractTranscriptPage } from './extract-transcript-page.ts'
import { fetchPage } from './fetch-page.ts'
import { isTranscriptHost } from './is-transcript-host.ts'
import { lastLine } from './last-line.ts'
import { renderedCapture } from './rendered-capture.ts'

/** Fetch one URL and extract it, reporting a failure rather than throwing it.
 *
 * Both halves can fail for reasons that are permanent - a host that refuses this
 * client, a page with no article in its HTML - and a permanent failure that
 * throws is one the drain retries forever. So every outcome is a `CapturedPage`,
 * and the caller decides what to write.
 *
 * Raw first, headless only as a reserve, and the trigger is "extraction produced
 * nothing" rather than "produced little" or "the fetch failed". Measured
 * 2026-08-05 on the wiki's two unresolved citations, which are one of each kind:
 * `docs.openclaw.ai/architecture` answers 200 with a 387-byte application shell
 * and renders to 99,905 characters, while `axios.com` answers 403 and renders to
 * a Cloudflare interstitial. A browser cures the page whose text is a second
 * request; it has nothing to say to a host that refused this client, so a failed
 * fetch returns here instead of paying for a render that would fail differently.
 *
 * A transcript host does not reach the reserve. `extractTranscriptPage` already
 * makes the second request, deliberately with no fallback chain under it,
 * because a video with no captions genuinely has no text and every step below
 * that point returns the player's chrome instead.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const capturePage = async (url: string): Promise<CapturedPage> => {
  let html: string
  try {
    html = await fetchPage(url)
  } catch (error) {
    return {
      html: '',
      page: null,
      reason: `fetch failed: ${lastLine(error instanceof Error ? error.message : String(error))}`,
    }
  }
  const transcriptHost = isTranscriptHost(url)
  const page = transcriptHost
    ? await extractTranscriptPage(html, url)
    : extractPage(html, url)
  if (page !== null) return { html, page, reason: null }
  return transcriptHost
    ? { html, page: null, reason: 'no readable content in the page' }
    : renderedCapture(url, html)
}
