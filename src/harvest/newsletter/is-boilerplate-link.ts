import { BOILERPLATE_HOSTS } from './boilerplate-hosts.ts'
import { BOILERPLATE_PATH_SUFFIXES } from './boilerplate-path-suffixes.ts'
import { BOILERPLATE_SLUGS } from './boilerplate-slugs.ts'

/** Medium's own footer links carry a post id like any article, so the post-id
 * test alone cannot reject them. Measured over 183 digests, `work-at-medium`,
 * `medium-privacy-policy` and `medium-terms-of-service` each appeared 178 times
 * and would otherwise have dominated the harvest
 * (docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:189-213). */
export const isBoilerplateLink = (normalizedUrl: string): boolean => {
  const parsed = new URL(normalizedUrl)
  const host = parsed.host.toLowerCase()
  const path = parsed.pathname.toLowerCase()
  return (
    BOILERPLATE_HOSTS.includes(host) ||
    BOILERPLATE_SLUGS.some((slug) => path.includes(slug)) ||
    BOILERPLATE_PATH_SUFFIXES.some((suffix) => path.endsWith(suffix))
  )
}
