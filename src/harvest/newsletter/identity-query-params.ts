/** Hosts where the query string carries the page's identity, and which
 * parameters carry it.
 *
 * `normalizeArticleUrl` drops the query because Medium stamps a per-recipient
 * tracking parameter onto every digest link, and dropping it is what collapsed
 * 4835 links into 1462 articles. On `youtube.com/watch` the same rule erases
 * the video: every watch URL normalizes to `youtube.com/watch`, so the second
 * video captured is a duplicate of the first.
 *
 * Measured 2026-08-04, and the reason this is a list rather than a heuristic:
 * the one YouTube clip already in the store carries `?v=` in its
 * `normalized_url`, because the extension lane wrote it, while the drain lane
 * goes through this function and would not. Two lanes disagreeing about a
 * clip's identity is the failure this closes.
 *
 * `youtu.be` is absent on purpose - it carries the id in the path, so the
 * default rule is already correct there. */
export const IDENTITY_QUERY_PARAMS: ReadonlyMap<string, readonly string[]> =
  new Map([
    ['youtube.com', ['v']],
    ['www.youtube.com', ['v']],
    ['m.youtube.com', ['v']],
  ])
