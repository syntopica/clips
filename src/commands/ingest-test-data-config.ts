/** Configure the temporary data repository with independent engine roots.
 * Absolute temporary paths keep those roots valid inside ingest worktrees. */
export const ingestTestDataConfig = (
  brainEngine: string,
  clipsEngine: string,
): Record<string, string> => ({
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
        brain: { path: brainEngine, apiVersion: 1 },
        clips: { path: clipsEngine, apiVersion: 1 },
      },
    },
    null,
    2,
  )}\n`,
})
