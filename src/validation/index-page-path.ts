/** The one root file a synthesis may touch. `index.md` is the wiki's root map,
 * so every new page needs a line in it; the allowlist in
 * ALLOWED_PAGE_DIRECTORIES covers the five page directories only, which is why
 * that line needed a separate manual commit after every ingest. The exception
 * is narrow on purpose: modification only (see indexChangeFailure), and the
 * root map carries no frontmatter, so the page frontmatter rule does not apply
 * to it (see indexContentFailure). */
export const INDEX_PAGE_PATH = 'index.md'
