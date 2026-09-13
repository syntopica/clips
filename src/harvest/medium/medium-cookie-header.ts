/** The `Cookie` request header Medium expects: the decrypted jar serialized as
 * `name=value` pairs separated by `; `. Values are sent verbatim - Chrome
 * already stores them in their wire form, so re-encoding them would invalidate
 * the session.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:76-92. */
export const mediumCookieHeader = (cookies: Map<string, string>): string =>
  [...cookies].map(([name, value]) => `${name}=${value}`).join('; ')
