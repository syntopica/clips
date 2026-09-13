import type { CollectedDigestLinks } from './collected-digest-links.ts'

/** What a newsletter sweep that did not run contributes: nothing, in the shape
 * the totals are computed from. Read-only at every use, so one frozen value
 * serves them all. */
export const EMPTY_DIGEST_LINKS: CollectedDigestLinks = Object.freeze({
  articles: [],
  emailCount: 0,
  linkCount: 0,
  senders: [],
})
