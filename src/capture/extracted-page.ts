import type { PageExtractor } from './page-extractor.ts'

/** A fetched page reduced to what a clip directory needs. `body` is markdown.
 *
 * `siteExtractor` records whether one of Defuddle's site-specific extractors
 * handled the page rather than its generic heuristics, because the two produce
 * very different markdown from the same page and a clip that reads oddly is
 * otherwise impossible to attribute afterwards. */
export type ExtractedPage = {
  title: string
  url: string
  author: string | null
  body: string
  extractor: PageExtractor
  siteExtractor: boolean
}
