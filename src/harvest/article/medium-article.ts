/** A fetched Medium article reduced to what a clip directory needs: the body as
 * markdown plus the metadata that cannot be recovered from the markdown itself.
 * `isLocked` is carried rather than acted on so the caller can decide what to
 * do with a members-only post.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export type MediumArticle = {
  title: string
  url: string
  author: string | null
  isLocked: boolean
  body: string
}
