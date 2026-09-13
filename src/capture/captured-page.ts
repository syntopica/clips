import type { ExtractedPage } from './extracted-page.ts'

/** What one fetch-and-extract produced: the source HTML always, and the
 * extraction only when something in the page read as content.
 *
 * `page: null` is a real outcome rather than an error - the caller turns it into
 * a clip that keeps the URL and says it has no body. `reason` names why, so the
 * clip records what happened instead of leaving a reader to guess. */
export type CapturedPage = {
  html: string
  page: ExtractedPage | null
  reason: string | null
}
