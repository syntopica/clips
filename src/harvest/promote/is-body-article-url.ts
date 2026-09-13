/** Whether a ticked article's URL is a body-content identity - the synthetic
 * `vexa://` scheme `bodyArticleUrl` builds - rather than a page to fetch. The
 * scheme is the routing bit: everything after it differs per shape. */
export const isBodyArticleUrl = (url: string): boolean =>
  url.startsWith('vexa://')
