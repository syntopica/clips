/** Sent with every Medium request. The cookies come from this user's Chrome,
 * so the requests claim to be that same Chrome: a default Node user agent on a
 * browser session is the kind of mismatch that gets a session challenged. */
export const MEDIUM_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
