import Defuddle from 'defuddle/full'
import { JSDOM } from 'jsdom'
import { DOM_FALLBACKS } from './dom-fallbacks.ts'
import type { ExtractedPage } from './extracted-page.ts'
import { htmlToMarkdown } from './html-to-markdown.ts'
import { MIN_EXTRACTED_LENGTH } from './min-extracted-length.ts'
import { stripNonContentElements } from './strip-non-content-elements.ts'

/** Turn fetched HTML into a page's body and metadata, or `null` when nothing in
 * it reads as content.
 *
 * Defuddle first, because it ships site-specific extractors for the hosts this
 * brain is fed from - X, Reddit, YouTube, GitHub, Hacker News, Substack,
 * Wikipedia, Medium and twenty-odd others - and only falls back to heuristics
 * otherwise. The chain below it is the clipper's, unchanged, so a page both
 * lanes capture reads the same either way.
 *
 * `parse()` rather than `parseAsync()`: the async path is what reaches the
 * network, for things like a YouTube transcript, and this runs against HTML
 * already in hand with no page to fetch from.
 *
 * Returning `null` is a real outcome, not an error. The caller turns it into a
 * body-less clip that keeps the URL, which is the point: a page nothing could
 * read is reported rather than silently dropped.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const extractPage = (
  html: string,
  url: string,
): ExtractedPage | null => {
  const { window } = new JSDOM(html, { url })
  const parsed = new Defuddle(window.document, { url }).parse()
  const title = parsed.title === '' ? window.document.title : parsed.title
  const author = parsed.author === '' ? null : parsed.author

  const defuddled = htmlToMarkdown(parsed.content)
  if (defuddled.length >= MIN_EXTRACTED_LENGTH) {
    return {
      title,
      url,
      author,
      body: defuddled,
      extractor: 'defuddle',
      // Defuddle derives the name it reports from `constructor.name`, and the
      // published bundles are minified, so only the presence of a site
      // extractor survives - never a usable name. A boolean is the honest field.
      siteExtractor: parsed.extractorType !== undefined,
    }
  }

  // Defuddle has had its look, including at the script tags its site
  // extractors mine; from here down, script and style text is noise that the
  // fallbacks would otherwise read as the page.
  stripNonContentElements(window.document)

  for (const { extractor, selector } of DOM_FALLBACKS) {
    const element = window.document.querySelector(selector)
    if (element === null) continue
    const body = htmlToMarkdown(element.innerHTML)
    if (body.length >= MIN_EXTRACTED_LENGTH)
      return { title, url, author, body, extractor, siteExtractor: false }
  }

  const text = window.document.body.textContent.trim()
  return text.length >= MIN_EXTRACTED_LENGTH
    ? {
        title,
        url,
        author,
        body: text,
        extractor: 'innertext',
        siteExtractor: false,
      }
    : null
}
