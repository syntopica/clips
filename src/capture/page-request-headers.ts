import { CHROME_COOKIE_DATABASE_PATH } from '../harvest/medium/chrome-cookie-database-path.ts'
import { mediumCookieHeader } from '../harvest/medium/medium-cookie-header.ts'
import { readChromeSafeStorageKey } from '../harvest/medium/read-chrome-safe-storage-key.ts'
import { readMediumCookies } from '../harvest/medium/read-medium-cookies.ts'
import { BROWSER_USER_AGENT } from './browser-user-agent.ts'
import { isMediumHost } from './is-medium-host.ts'

/** The request headers for one page fetch.
 *
 * A bare browser identity for the open web, plus Chrome's Medium session when
 * the host is Medium. The cookie jar is opened here rather than by the caller
 * because the drain fetches one page at a time from arbitrary hosts, so there is
 * no run-length batch to amortise it over - unlike the harvest, whose promotion
 * pass opens it once for a whole ticked list. */
export const pageRequestHeaders = (url: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'User-Agent': BROWSER_USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip',
  }
  if (isMediumHost(url)) {
    headers['Cookie'] = mediumCookieHeader(
      readMediumCookies(
        CHROME_COOKIE_DATABASE_PATH,
        readChromeSafeStorageKey(),
      ),
    )
  }
  return headers
}
