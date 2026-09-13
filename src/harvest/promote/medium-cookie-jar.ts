import { CHROME_COOKIE_DATABASE_PATH } from '../medium/chrome-cookie-database-path.ts'
import { readChromeSafeStorageKey } from '../medium/read-chrome-safe-storage-key.ts'
import { readMediumCookies } from '../medium/read-medium-cookies.ts'

/** The logged-in Medium cookies a promote run fetches with, read from the
 * signed-in Chrome profile. One jar per run, shared by every article in it. */
export const mediumCookieJar = (): Map<string, string> =>
  readMediumCookies(CHROME_COOKIE_DATABASE_PATH, readChromeSafeStorageKey())
