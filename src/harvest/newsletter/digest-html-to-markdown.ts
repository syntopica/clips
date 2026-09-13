import { Parser } from 'htmlparser2'
import { digestLinkLine } from './digest-link-line.ts'
import { headingTagLevel } from './heading-tag-level.ts'
import { isSkippedContentTag } from './is-skipped-content-tag.ts'

/** Render a newsletter's HTML body as the link-and-heading markdown the digest
 * extractors read, keeping the heading level that separates an article's title
 * from its subtitle.
 *
 * Only anchors are emitted, because only anchors carry articles - everything
 * else in an email body is layout. Both nestings occur in the wild and both
 * have to keep their level: Medium wraps one anchor around the pair
 * (`<a><h2>title</h2><h3>subtitle</h3></a>`, which is why a heading inside an
 * anchor inherits its href), while other senders put the anchor inside the
 * heading.
 *
 * Parsed as a stream of events rather than into a document, because this runs
 * once per message over an archive: JSDOM aborts Node with `Ineffective
 * mark-compacts near heap limit` at roughly body 500 of 1,872, and calling
 * `window.close()` on each does not change that. Reading the same 2,036 rows
 * without building a DOM holds flat at 229 MB.
 *
 * A general HTML-to-markdown pass is also the wrong tool here and was measured
 * to be: `turndown` with the GFM plugin leaves an email's nested layout tables
 * as raw HTML, so not one digest heading survived the conversion. */
export const digestHtmlToMarkdown = (html: string): string => {
  const lines: string[] = []
  let href: string | null = null
  let anchorText: string[] = []
  let anchorHeadingLevel: number | null = null
  let anchorHasHeading = false
  let headingLevel: number | null = null
  let headingText: string[] = []
  let skipping = 0

  const parser = new Parser({
    onopentag(name, attributes) {
      if (isSkippedContentTag(name)) skipping += 1
      const level = headingTagLevel(name)
      if (level !== null) {
        headingLevel = level
        headingText = []
      }
      if (name !== 'a' || attributes['href'] === undefined) return
      href = attributes['href']
      anchorText = []
      anchorHeadingLevel = headingLevel
      anchorHasHeading = false
    },
    ontext(text) {
      if (skipping > 0) return
      if (headingLevel !== null) headingText.push(text)
      if (href !== null) anchorText.push(text)
    },
    onclosetag(name) {
      if (isSkippedContentTag(name) && skipping > 0) skipping -= 1
      const level = headingTagLevel(name)
      if (level !== null) {
        if (href !== null) {
          lines.push(digestLinkLine(level, headingText.join(''), href))
          anchorHasHeading = true
        }
        headingLevel = null
      }
      if (name !== 'a' || href === null) return
      if (!anchorHasHeading)
        lines.push(
          digestLinkLine(anchorHeadingLevel, anchorText.join(''), href),
        )
      href = null
    },
  })
  parser.write(html)
  parser.end()
  return lines.join('\n\n')
}
