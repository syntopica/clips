import { SOCIAL_SOURCE_HOSTS } from './social-source-hosts.ts'

/** Whether a host is one of the social ones, subdomains included.
 *
 * The dot in the suffix test is what stops `notx.com` matching `x.com`, and it
 * matters more than it looks: the shortest entry in the list is two characters
 * before the dot, so a bare `endsWith` would rank a large share of the web as
 * social. */
export const isSocialSourceHost = (host: string): boolean => {
  const normalized = host.toLowerCase().replace(/^www\./, '')
  return SOCIAL_SOURCE_HOSTS.some(
    (social) => normalized === social || normalized.endsWith(`.${social}`),
  )
}
