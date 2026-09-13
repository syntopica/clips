import { mediumCookieHeader } from './medium-cookie-header.ts'

/** Everything `POST https://medium.com/_/graphql` requires beyond the cookie
 * jar: the operation name it dispatches on, a same-origin `Origin`/`Referer`
 * pair, and the CSRF token, which Medium expects echoed from the `xsrf` cookie
 * into `x-xsrf-token`.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:172-175.
 *
 * The User-Agent is a desktop Chrome string because the cookie jar was issued
 * to desktop Chrome; a mismatched agent is the kind of thing Medium's edge
 * checks. */
export const mediumGraphqlHeaders = (
  cookies: Map<string, string>,
  operationName: string,
): Record<string, string> => ({
  Cookie: mediumCookieHeader(cookies),
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'graphql-operation': operationName,
  Origin: 'https://medium.com',
  Referer: 'https://medium.com/me/lists',
  'x-xsrf-token': cookies.get('xsrf') ?? '',
})
