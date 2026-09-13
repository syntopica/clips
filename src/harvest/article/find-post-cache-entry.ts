/** Locate the article's own `"Post:<id>"` cache entry in the Apollo state.
 *
 * A page caches more than its own post: recommended and related articles get
 * their own thin `Post:` entries carrying an id, a URL and no title. Taking the
 * first one read a neighbour's stub and failed on the missing title, so the
 * article is identified by the field only it has - the parameterised
 * `content(...)` that holds the body. The content field is parameterised on the
 * live page (`content({"postMeteringOptions":{"referrer":""}})`), so it is
 * found by prefix; the unparameterised name is accepted too.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const findPostCacheEntry = (state: Record<string, unknown>): unknown => {
  const entry = Object.entries(state).find(
    ([key, value]) =>
      key.startsWith('Post:') &&
      typeof value === 'object' &&
      value !== null &&
      Object.keys(value).some(
        (field) => field === 'content' || field.startsWith('content('),
      ),
  )?.[1]
  if (entry === undefined)
    throw new Error(
      'No "Post:<id>" entry carrying a content field in window.__APOLLO_STATE__: ' +
        'this page is not a Medium article, or its body was not delivered',
    )
  return entry
}
