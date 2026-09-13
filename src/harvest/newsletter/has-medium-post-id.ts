import { MEDIUM_POST_ID_PATTERN } from './medium-post-id-pattern.ts'

/** The positive test that separates articles from navigation. Digest bodies mix
 * articles with profile, tag and publication links that have no post id, and
 * requiring the id is cheaper and far more precise than enumerating every
 * navigation shape
 * (docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:189-198). */
export const hasMediumPostId = (normalizedUrl: string): boolean =>
  MEDIUM_POST_ID_PATTERN.test(normalizedUrl)
