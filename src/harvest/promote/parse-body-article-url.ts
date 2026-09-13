/** The sender and subject slug back out of a
 * `vexa://<domain>/<local>/<slug>` identity, or null when the URL is not one -
 * a malformed identity fails one article with a readable reason, not the
 * batch.
 *
 * Parsed with the same WHATWG rules that built it: the sender's domain is the
 * host, its local part is the first path segment (percent-encoded, because a
 * `@` in the authority would read as userinfo), and the slug is the second. */
export const parseBodyArticleUrl = (
  url: string,
): { sender: string; slug: string } | null => {
  const parsed = URL.parse(url)
  if (parsed === null || parsed.protocol !== 'vexa:' || parsed.hostname === '')
    return null
  const [local, slug] = parsed.pathname.replace(/^\//u, '').split('/')
  if (local === undefined || local === '' || slug === undefined || slug === '')
    return null
  return { sender: `${decodeURIComponent(local)}@${parsed.hostname}`, slug }
}
