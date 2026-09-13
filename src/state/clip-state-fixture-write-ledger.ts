import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { FIXTURE_CLIP_ID } from './clip-state-fixture-clip-id.ts'
import { FIXTURE_LEDGER_PATH } from './clip-state-fixture-ledger-path.ts'

/** Writes a valid ledger for FIXTURE_CLIP_ID into the given brain. */
export const writeLedger = (brain: string, contentHash: string): void => {
  mkdirSync(join(brain, '.ingest', 'clips'), { recursive: true })
  writeFileSync(
    join(brain, FIXTURE_LEDGER_PATH),
    JSON.stringify({
      schemaVersion: 1,
      clipId: FIXTURE_CLIP_ID,
      clipFormatVersion: 1,
      contentSha256: contentHash,
      clipRepoCommit: 'b'.repeat(40),
      clipSourcePath: 'clips/pending/2026/07/example',
      brainBaseCommit: 'c'.repeat(40),
      processedAt: '2026-07-27T15:00:00Z',
      reviewedAt: '2026-07-27T15:02:00Z',
      pagesTouched: ['topics/browser-apis.md'],
      synthesizer: {
        model: 'none',
        promptSha256: 'd'.repeat(64),
        toolVersion: '0.1.0',
        boundary: 'none',
      },
    }),
  )
}
