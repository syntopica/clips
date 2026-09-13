/** Whether a URL is served by Medium, including the custom domains its
 * publications use.
 *
 * It decides one thing: whether to attach the Chrome session cookies. A
 * member-only article returns only its intro to an anonymous fetch, verified on
 * 2026-07-29, and cookies cost nothing to send. Everything else about the fetch
 * is identical, which is the point of having one transport. */
export const isMediumHost = (url: string): boolean => {
  const host = URL.parse(url)?.hostname.toLowerCase()
  return host === undefined
    ? false
    : host === 'medium.com' || host.endsWith('.medium.com')
}
