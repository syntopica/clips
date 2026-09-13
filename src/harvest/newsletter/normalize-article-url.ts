import { IDENTITY_QUERY_PARAMS } from './identity-query-params.ts'

/** Medium stamps every digest link with `?source=email-<hash>-<send>-digest.reader`,
 * which differs per recipient and per send, so the same article arrives as a
 * different string in every email. Stripping the query is what makes
 * deduplication work at all: 4835 links collapsed to 1462 articles across 183
 * emails only because the tracking parameters were removed first
 * (docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:196-198).
 *
 * `IDENTITY_QUERY_PARAMS` is the exception, added 2026-08-04: on the handful of
 * hosts that put the page's identity in the query, the same rule erases the
 * page. Only the named parameters survive, and in a fixed order, so a URL
 * carrying tracking parameters alongside the identity still normalizes to one
 * string. */
export const normalizeArticleUrl = (raw: string): string => {
  const parsed = new URL(raw.trim())
  const host = parsed.host.toLowerCase()
  const path = parsed.pathname.endsWith('/')
    ? parsed.pathname.slice(0, -1)
    : parsed.pathname
  const identity = (IDENTITY_QUERY_PARAMS.get(host) ?? [])
    .map((name) => [name, parsed.searchParams.get(name)] as const)
    .filter((pair): pair is readonly [string, string] => pair[1] !== null)
    .map(([name, value]) => `${name}=${value}`)
    .join('&')
  const query = identity === '' ? '' : `?${identity}`
  return `${parsed.protocol}//${host}${path}${query}`
}
