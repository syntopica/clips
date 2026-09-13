/** One claim's source reference, as written in a page's prose.
 *
 * SPEC:2026-08-03-claim-level-citations-design - refs are **positional over the
 * page's own `sources:` list**: the first entry is `S1`, the second `S2`.
 * Deterministic, derivable by any reader, nothing stored twice.
 *
 * `OWN` is the one ref that is not positional. It is the owner's own knowledge,
 * the tier `SOURCE_AUTHORITY_TIERS` has named since the authority order shipped
 * and that nothing could return, because a `sources:` entry is a path or a url
 * and no page could say "this came from me". It is spelled as a word rather
 * than `S0` on purpose: a numeric neighbour of `S1` invites the typo that
 * silently reattributes a claim, and the tier it maps to outranks everything.
 *
 * The type says nothing about whether a ref resolves. `S9` on a two-source page
 * is a well-formed `ClaimRef` and an unresolved one; that is what
 * `unresolvedClaimRefs` answers. */
export type ClaimRef = `S${number}` | 'OWN'
