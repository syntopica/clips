import type { PageExtractor } from './page-extractor.ts'

export type DomFallback = {
  extractor: PageExtractor
  selector: string
}
