/** How much weight a source carries when two of them disagree.
 *
 * `owner` is the owner's own knowledge, and it outranks everything for the
 * reason `gbrain` gives: a person correcting the record is not one more web
 * page. **Nothing returns it today.** A `sources:` entry is a path or a url, so
 * the wiki has no way to write "this came from me" - the same missing
 * distinction the claim-level-citations entry in `TODO.md` names, and where the
 * representation for it belongs. It is in the order because leaving it out
 * would state the ranking wrongly, not because a check can produce it.
 *
 * `enrichment`, gbrain's fourth rank, is deliberately absent: nothing in this
 * repository calls an enrichment API, and a tier no source can ever be is a
 * rule that reads as considered while being decoration. */
export type SourceAuthorityTier = 'owner' | 'primary' | 'web' | 'social'
