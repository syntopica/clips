/** Exact host or parent-domain suffix (SPEC:328-329): `mail.example.com`
 * matches an entry `example.com`, but `notexample.com` does not. */
export const matchesSensitiveDomain = (
  site: string,
  domains: string[],
): string | null => {
  const host = site.trim().toLowerCase()
  for (const domain of domains) {
    if (host === domain || host.endsWith(`.${domain}`)) return domain
  }
  return null
}
