import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

/** Extracted HTML as GitHub-flavored markdown, configured as the clipper
 * configures it: ATX headings and fenced code blocks, plus the GFM plugin for
 * tables, strikethrough and task lists. A page both lanes capture should read
 * the same either way, which only holds while the conversion matches. */
export const htmlToMarkdown = (html: string): string => {
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  })
  service.use(gfm)
  return service.turndown(html).trim()
}
