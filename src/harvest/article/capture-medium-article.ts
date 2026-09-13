import { CHROME_COOKIE_DATABASE_PATH } from '../medium/chrome-cookie-database-path.ts'
import { fetchMediumPage } from '../medium/fetch-medium-page.ts'
import { readChromeSafeStorageKey } from '../medium/read-chrome-safe-storage-key.ts'
import { readMediumCookies } from '../medium/read-medium-cookies.ts'
import type { CapturedMediumArticle } from './captured-medium-article.ts'
import { extractMediumArticle } from './extract-medium-article.ts'

/** Fetch one Medium URL and extract it, opening the cookie jar for this call
 * alone.
 *
 * `promoteArticle` deliberately does not use this: a promotion run opens the
 * jar once and passes it to every article, which is what its input type exists
 * to express. This is the one-off shape instead - a single URL from a script
 * that has no run around it, which is what the thin-clip backfill and the
 * remote-drift check both need. */
export const captureMediumArticle = async (
  url: string,
): Promise<CapturedMediumArticle> => {
  const html = await fetchMediumPage(
    url,
    readMediumCookies(CHROME_COOKIE_DATABASE_PATH, readChromeSafeStorageKey()),
  )
  return { article: extractMediumArticle(html), html }
}
