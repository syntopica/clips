import type { CapturedPage } from './captured-page.ts'
import { extractPage } from './extract-page.ts'
import { lastLine } from './last-line.ts'
import { renderPage } from './render-page.ts'

/** The headless reserve: render the page and extract it again, when the raw
 * transport brought bytes that held no article.
 *
 * Every outcome is still a `CapturedPage`, so a reserve that cannot run - no
 * browser installed, a load that never settles - costs the body-less clip its
 * reason string and nothing else. The raw HTML is what the caller hands over
 * and what comes back on that path, because a clip whose render failed should
 * carry the bytes the server actually sent.
 *
 * When the render succeeds, the rendered DOM replaces it: `source.html` is
 * defined as what extraction ran against, and `source_html_sha256` hashes it.
 * That is also the only record a clip keeps of having been rendered - the
 * schema is shared with the clipper and gains no field for it, on the
 * precedent set for the body-less clip's own `extractor`.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const renderedCapture = async (
  url: string,
  rawHtml: string,
): Promise<CapturedPage> => {
  let rendered: string
  try {
    rendered = await renderPage(url)
  } catch (error) {
    return {
      html: rawHtml,
      page: null,
      reason: `no readable content in the page, and the headless retry failed: ${lastLine(
        error instanceof Error ? error.message : String(error),
      )}`,
    }
  }

  const page = extractPage(rendered, url)
  return {
    html: rendered,
    page,
    reason: page === null ? 'no readable content, rendered or raw' : null,
  }
}
