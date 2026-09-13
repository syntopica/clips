import { CHROME_COOKIE_DATABASE_PATH } from './chrome-cookie-database-path.ts'
import { fetchMediumPage } from './fetch-medium-page.ts'
import { fetchReadingList } from './fetch-reading-list.ts'
import { MEDIUM_LISTS_URL } from './medium-lists-url.ts'
import { mediumViewerId } from './medium-viewer-id.ts'
import { postMediumGraphql } from './post-medium-graphql.ts'
import { readChromeSafeStorageKey } from './read-chrome-safe-storage-key.ts'
import { readMediumCookies } from './read-medium-cookies.ts'
import type { SavedPost } from './saved-post.ts'

/** Read the Chrome session and return every post in the reading list.
 *
 * The viewer id is discovered from a real page rather than configured, so the
 * whole chain - which account, which cookies, which reading list - follows from
 * whoever is signed into Chrome.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const collectSavedPosts = async (): Promise<SavedPost[]> => {
  const cookies = readMediumCookies(
    CHROME_COOKIE_DATABASE_PATH,
    readChromeSafeStorageKey(),
  )
  const userId = mediumViewerId(
    await fetchMediumPage(MEDIUM_LISTS_URL, cookies),
  )
  return fetchReadingList({ userId, cookies, post: postMediumGraphql })
}
