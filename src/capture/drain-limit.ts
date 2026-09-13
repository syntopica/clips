/** How many captures one drain run takes, from `--limit` or the default.
 *
 * 200 is the service's own page ceiling, so asking for more is answered with
 * 200 anyway. The default is the ceiling because the inbox is a handful of URLs
 * a day and a partial drain would be a surprise, not a feature; `--limit` is
 * there to bound a first run against a backlog nobody has looked at.
 *
 * A value that is not a positive integer throws rather than falling back: a
 * silent default after a typo drains everything when the operator asked for
 * three. */
export const drainLimit = (flag: string | null): number => {
  if (flag === null) return 200
  const limit = Number(flag)
  if (!Number.isInteger(limit) || limit <= 0)
    throw new Error(`--limit must be a positive integer: ${flag}`)
  return limit
}
