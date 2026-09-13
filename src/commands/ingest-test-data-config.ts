/** The temporary brain's own `syntopica.config.json`, keyed by its path.
 *
 * The index generator stopped deriving the wiki root from its own source
 * location on 2026-09-13, so a fixture brain that carries the scripts but not
 * this file fails every ingest at the index step. Both engine paths are the
 * data root itself, which is the documented monorepo case. Only the page
 * directories the fixture actually creates are listed, because `doctor`
 * requires every configured path to exist. */
export const INGEST_TEST_DATA_CONFIG: Record<string, string> = {
  'syntopica.config.json': `${JSON.stringify(
    {
      schemaVersion: 1,
      instanceId: 'ingest-fixture',
      brain: {
        pages: ['topics'],
        sources: 'sources',
        index: 'index.md',
        ledger: '.ingest',
      },
      clips: { archive: '.' },
      engines: {
        brain: { path: '.', apiVersion: 1 },
        clips: { path: '.', apiVersion: 1 },
      },
    },
    null,
    2,
  )}\n`,
}
