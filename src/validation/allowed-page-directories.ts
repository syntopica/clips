/** The only top-level directories a synthesized page may land in
 * (SPEC:361-362). `.ingest/` is deliberately absent: the CLI writes the
 * ledger itself as a trusted step, never the synthesizer (SPEC:368-372). */
export const ALLOWED_PAGE_DIRECTORIES = new Set([
  'projects',
  'business',
  'people',
  'topics',
  'personal',
])
