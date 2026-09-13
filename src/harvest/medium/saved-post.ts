/** One entry of the Medium reading list, reduced to the fields the harvest
 * pipeline actually consumes: `url` is the post's `mediumUrl`, and everything
 * the API may omit is nullable rather than optional so downstream code has one
 * absence to handle.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:142-170. */
export type SavedPost = {
  id: string
  title: string
  url: string
  readingTime: number | null
  firstPublishedAt: string | null
  creator: string | null
}
