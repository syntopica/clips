import Defuddle from 'defuddle/full'
import { JSDOM } from 'jsdom'
import type { ExtractedPage } from './extracted-page.ts'
import { htmlToMarkdown } from './html-to-markdown.ts'
import { MIN_EXTRACTED_LENGTH } from './min-extracted-length.ts'

/** Extract a page whose text arrives over a second request, not in its HTML.
 *
 * `parseAsync()` is the whole difference, and it is large: measured against
 * `youtube.com/watch?v=zmrPY6S1FwY` on 2026-08-04, the synchronous parse returns
 * 318 characters - the embed iframe - and the asynchronous one returns 23,898,
 * the timestamped transcript.
 *
 * There is no fallback chain below it, and that is deliberate. The chain in
 * `extractPage` ends at `document.body.textContent`, which on a watch page is
 * jsdom reading the inline `<script>` tags: 636,918 characters of
 * `ytInitialPlayerResponse` JSON, written to the clip as if it were an article.
 * A video with no captions has no readable text, so `null` here becomes a
 * body-less clip that keeps the URL - the outcome this repository already
 * chose for a page nothing can read.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const extractTranscriptPage = async (
  html: string,
  url: string,
): Promise<ExtractedPage | null> => {
  const { window } = new JSDOM(html, { url })
  const parsed = await new Defuddle(window.document, { url }).parseAsync()
  const body = htmlToMarkdown(parsed.content)
  if (body.length < MIN_EXTRACTED_LENGTH) return null
  return {
    title: parsed.title === '' ? window.document.title : parsed.title,
    url,
    author: parsed.author === '' ? null : parsed.author,
    body,
    extractor: 'defuddle',
    siteExtractor: true,
  }
}
