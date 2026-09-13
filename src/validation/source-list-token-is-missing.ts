/** True when a `sources:` list line yielded no leading word to check for a
 * claim marker. The comparison here is between a regex match result and
 * `undefined` - two plain strings from a wiki page, never a secret - named as
 * its own predicate so a linter built to flag secret comparisons can see
 * that. */
export const sourceListTokenIsMissing = (
  token: string | undefined,
): token is undefined => token === undefined
