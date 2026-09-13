import type { TickedArticle } from '../harvest/promote/ticked-article.ts'
import type { UndrainedCapture } from './undrained-capture.ts'

/** A capture in the shape the promotion path already takes.
 *
 * The title is empty because the inbox holds none - the phone shares a URL, not
 * a page - and `promoteArticle` overwrites it from the fetched article anyway.
 * The note becomes the topic: it is the only thing the owner typed at capture
 * time, and `tags` is where a harvested clip's topic goes, so a phone capture's
 * one word of intent lands in the same field rather than being dropped. */
export const captureAsArticle = (capture: UndrainedCapture): TickedArticle => ({
  url: capture.url,
  title: '',
  topic: capture.note ?? '',
})
