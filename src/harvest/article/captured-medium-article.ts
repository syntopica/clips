import type { MediumArticle } from './medium-article.ts'

/** An extracted article together with the bytes it was extracted from.
 *
 * The raw HTML is carried rather than discarded because a clip directory stores
 * `source.html` beside `index.md`, and re-fetching to obtain it would be a
 * second request against a page that has already been read once. */
export type CapturedMediumArticle = {
  article: MediumArticle
  html: string
}
