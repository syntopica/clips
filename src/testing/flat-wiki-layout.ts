import type { WikiLayout } from '../layout/wiki-layout.ts'

/** The layout every test written before 2026-09-30 assumed without naming it:
 * pages in five directories at the repository root, the index beside them and
 * the ledger in `.ingest`. */
export const FLAT_WIKI_LAYOUT: WikiLayout = {
  pageRoot: '',
  pageDirectories: ['projects', 'business', 'people', 'topics', 'personal'],
  index: 'index.md',
  sources: 'sources',
  ledger: '.ingest',
}
