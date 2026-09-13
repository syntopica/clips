/** How long a `last_verified:` claim stands before the audit stops believing it.
 *
 * 120 days, `anh-chu`'s number, and deliberately longer than the 90-day stale
 * line: `updated:` moves on any edit, so a page can be current and unverified
 * at the same time. This is the other question - not "has anyone touched it"
 * but "has anyone checked it against the thing it describes", which is slower
 * work and worth asking about less often. */
export const PAGE_VERIFIED_DAYS = 120
