import type { HarvestedArticle } from '../newsletter/harvested-article.ts'
import { normalizeArticleUrl } from '../newsletter/normalize-article-url.ts'
import type { SavedPost } from './saved-post.ts'

/** Convert saved posts into the same shape the newsletter lane produces, so
 * both collectors feed one deduplication, one classifier and one set of triage
 * files. An article the user both saved and received in a digest must resolve
 * to a single entry, which only works if the URL is normalized identically on
 * both paths.
 *
 * `firstSeen` is the post's publication date when Medium gave one: the reading
 * list carries no "saved at" timestamp, and publication date is the honest
 * available answer rather than backdating everything to today. */
export const savedPostsAsArticles = (
  posts: readonly SavedPost[],
  fallbackDate: string,
): HarvestedArticle[] =>
  posts.map((post) => ({
    url: normalizeArticleUrl(post.url),
    title: post.title,
    firstSeen: post.firstPublishedAt?.slice(0, 10) ?? fallbackDate,
    sender: 'medium-list',
    count: 1,
  }))
