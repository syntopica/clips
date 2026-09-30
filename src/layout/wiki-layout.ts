/** Where the wiki sits inside its repository, as repository-relative posix
 * paths, so the same values address the main checkout and an ingest worktree.
 *
 * Two path spellings exist and this is what converts between them. A
 * repository path is what git prints and stages (`brain/topics/x.md`). A page
 * path is relative to `pageRoot` (`topics/x.md`): it is what wikilinks name,
 * what `sources:` entries are written against, and what every ledger records in
 * `pagesTouched` and `pagesRead`. Where the pages sit at the repository root
 * the two are the same string, which is why nothing noticed the difference
 * until an instance moved its pages under a subdirectory. */
export type WikiLayout = {
  /** The directory holding the index, `''` at the repository root. */
  readonly pageRoot: string
  /** Page directories relative to `pageRoot`. */
  readonly pageDirectories: readonly string[]
  /** The index relative to `pageRoot`. */
  readonly index: string
  /** Repository-relative. */
  readonly sources: string
  /** Repository-relative. */
  readonly ledger: string
}
