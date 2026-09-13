import { MEDIUM_POST_ID_PATTERN } from './medium-post-id-pattern.ts'

/** The 12-character post id a Medium URL ends with, or null when there is
 * none. That id, not the URL, is what identifies the article: the same post is
 * reachable as `medium.com/@author/<slug>-<id>`, as
 * `author.medium.com/<slug>-<id>`, and through any publication that hosts it. */
export const mediumPostId = (normalizedUrl: string): string | null => {
  const match = MEDIUM_POST_ID_PATTERN.exec(normalizedUrl)
  return match === null ? null : match[0].slice(1)
}
