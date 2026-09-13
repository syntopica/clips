import type { PageExtractor } from './page-extractor.ts'

/** The DOM-shape fallbacks, in the order brain-clipper tries them: the most
 * specific container first, the whole document last. Tried only when Defuddle
 * returned nothing substantial, which is the honest reading of an extractor
 * that found no article. */
export const DOM_FALLBACKS: readonly {
  extractor: PageExtractor
  selector: string
}[] = [
  { extractor: 'article', selector: 'article' },
  { extractor: 'main', selector: 'main' },
  { extractor: 'body', selector: 'body' },
]
