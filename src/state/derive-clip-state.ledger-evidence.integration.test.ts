import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contentSha256 } from '../clips/content-sha256.ts'
import { git } from '../testing/git.ts'
import { FIXTURE_CLIP_ID } from './clip-state-fixture-clip-id.ts'
import { clipOnDisk } from './clip-state-fixture-clip-on-disk.ts'
import { clipFixture } from './clip-state-fixture-clip.ts'
import { commitLedger } from './clip-state-fixture-commit-ledger.ts'
import { FIXTURE_LEDGER_PATH } from './clip-state-fixture-ledger-path.ts'
import { newRepositoryWithOrigin } from './clip-state-fixture-new-repository-with-origin.ts'
import { newRepository } from './clip-state-fixture-new-repository.ts'
import { stateOf } from './clip-state-fixture-state-of.ts'
import { writeLedger } from './clip-state-fixture-write-ledger.ts'

// Split from derive-clip-state.integration.test.ts to stay under the repo's
// max-lines file budget - the ledger-evidence half. See
// derive-clip-state.routing.integration.test.ts for the bucket/state.json
// routing half. Every `it` name, body and assertion is unchanged; shared
// fixtures now live in clip-state-fixture-*.ts.

describe('deriveClipState, with a ledger present: how far it has traveled', () => {
  it('calls an uncommitted ledger synthesized', async () => {
    const brain = newRepositoryWithOrigin()
    const directory = clipOnDisk()
    writeLedger(brain, await contentSha256(directory))
    const evidence = await stateOf(brain, clipFixture('pending', {}, directory))
    expect(evidence.state).toBe('synthesized')
    expect(evidence.reason).toContain(FIXTURE_LEDGER_PATH)
  })

  it('calls a committed but unpushed ledger locally-stale', async () => {
    const brain = newRepositoryWithOrigin()
    const directory = clipOnDisk()
    writeLedger(brain, await contentSha256(directory))
    commitLedger(brain)
    const evidence = await stateOf(brain, clipFixture('pending', {}, directory))
    expect(evidence.state).toBe('locally-stale')
    expect(evidence.reason).toContain('origin/main')
  })

  it('calls a ledger present in origin/main reconciliation-pending', async () => {
    const brain = newRepositoryWithOrigin()
    const directory = clipOnDisk()
    writeLedger(brain, await contentSha256(directory))
    commitLedger(brain)
    git(brain, 'push', '-q', 'origin', 'main')
    const evidence = await stateOf(brain, clipFixture('pending', {}, directory))
    expect(evidence.state).toBe('reconciliation-pending')
    expect(evidence.reason).toContain(
      `${FIXTURE_LEDGER_PATH} is present in origin/main`,
    )
  })
})

describe('deriveClipState, with a ledger present: guards before trusting the ledger', () => {
  it('says so when origin/main is not fetched, instead of throwing', async () => {
    // A fresh clone before the first fetch, and this fixture: `git merge-base
    // --is-ancestor <sha> origin/main` exits 128 there, which the old table
    // turned into an uncaught throw. Missing origin/main is a fact about the
    // local repository, not an inconsistency in the clip.
    const brain = newRepository()
    const directory = clipOnDisk()
    writeLedger(brain, await contentSha256(directory))
    commitLedger(brain)
    const evidence = await stateOf(brain, clipFixture('pending', {}, directory))
    expect(evidence.state).toBe('locally-stale')
    expect(evidence.reason).toContain('origin/main is not fetched')
  })

  it('calls a clip whose bytes no longer match the ledger inconsistent', async () => {
    const brain = newRepositoryWithOrigin()
    const directory = clipOnDisk()
    writeLedger(brain, await contentSha256(directory))
    writeFileSync(join(directory, 'index.md'), '# t, edited after ingest\n')
    const evidence = await stateOf(brain, clipFixture('pending', {}, directory))
    expect(evidence.state).toBe('inconsistent')
    expect(evidence.reason).toContain('LEDGER_CONTENT_MISMATCH')
  })
})

describe('deriveClipState, with a ledger present: unreadable ledgers and processed status', () => {
  it('calls an unreadable ledger inconsistent rather than losing the run', async () => {
    const brain = newRepositoryWithOrigin()
    const directory = clipOnDisk()
    mkdirSync(join(brain, '.ingest', 'clips'), { recursive: true })
    writeFileSync(join(brain, FIXTURE_LEDGER_PATH), '{ broken')
    const evidence = await stateOf(brain, clipFixture('pending', {}, directory))
    expect(evidence.state).toBe('inconsistent')
    expect(evidence.reason).toMatch(/not valid JSON/)
  })

  it('keeps a processed status ahead of the ledger check', async () => {
    const brain = newRepositoryWithOrigin()
    const directory = clipOnDisk()
    writeLedger(brain, await contentSha256(directory))
    const evidence = await stateOf(
      brain,
      clipFixture('pending', { status: 'processed' }, directory),
    )
    expect(evidence.state).toBe('reconciliation-pending')
    expect(evidence.reason).toContain(FIXTURE_CLIP_ID)
  })
})
