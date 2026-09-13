import { describe, expect, it } from 'vitest'
import type { ThinClip } from '../clips/thin-clip.ts'
import { git } from '../testing/git.ts'
import { clipFixture } from './clip-state-fixture-clip.ts'
import { newRepository } from './clip-state-fixture-new-repository.ts'
import { stateOf } from './clip-state-fixture-state-of.ts'

// Split from derive-clip-state.integration.test.ts to stay under the repo's
// max-lines file budget - the routing-by-bucket half. See
// derive-clip-state.ledger-evidence.integration.test.ts for the ledger-evidence
// half. Every `it` name, body and assertion is unchanged; shared fixtures now
// live in clip-state-fixture-*.ts.

describe('deriveClipState, routing by bucket and state.json, before the ledger matters', () => {
  it('calls a clip under pending/ with no ledger pending', async () => {
    const evidence = await stateOf(newRepository(), clipFixture('pending'))
    expect(evidence.state).toBe('pending')
    // Not "no ledger and no ingest branch": no branch is ever inspected, and
    // printing a check that did not happen is a lie told to the operator.
    expect(evidence.reason).toBe('no ledger')
  })

  it('calls a clip under needs-claude/ needs-claude regardless of anything else', async () => {
    const evidence = await stateOf(newRepository(), clipFixture('needs-claude'))
    expect(evidence.state).toBe('needs-claude')
  })

  it('calls a pending/ clip whose state.json says needs-claude inconsistent', async () => {
    // The directory and the state file contradict each other. Falling through
    // to `pending` would route it into the ordinary pipeline in plan 2b.
    const evidence = await stateOf(
      newRepository(),
      clipFixture('pending', { status: 'needs-claude' }),
    )
    expect(evidence.state).toBe('inconsistent')
    expect(evidence.reason).toMatch(/needs-claude/)
  })
})

describe('deriveClipState, a hand-processed clip still under pending/', () => {
  it('calls a processed clip with an unresolvable brainCommit inconsistent', async () => {
    // SPEC:256-270: processed with neither a resolvable commit nor a ledger is
    // Inconsistent. Never synthesize it, never move it.
    const evidence = await stateOf(
      newRepository(),
      clipFixture('pending', { status: 'processed', brainCommit: 'deadbee' }),
    )
    expect(evidence.state).toBe('inconsistent')
  })

  it('recovers a hand-processed clip from a resolvable brainCommit', async () => {
    const brain = newRepository()
    const head = git(brain, 'rev-parse', 'HEAD')
    const evidence = await stateOf(
      brain,
      clipFixture('pending', {
        status: 'processed',
        brainCommit: head.slice(0, 7),
      }),
    )
    expect(evidence.state).toBe('reconciliation-pending')
    expect(evidence.reason).toContain(head)
  })
})

describe('deriveClipState, a clip under processed/', () => {
  it('calls a reconciled clip reconciled, with the full sha as evidence', async () => {
    const brain = newRepository()
    const head = git(brain, 'rev-parse', 'HEAD')
    const evidence = await stateOf(
      brain,
      clipFixture('processed', { status: 'processed', brainCommit: head }),
    )
    expect(evidence.state).toBe('reconciled')
    expect(evidence.reason).toContain(head)
  })

  it('refuses to bless an unresolvable brainCommit under processed/', async () => {
    // The same value that is inconsistent under pending/. The bucket is not
    // evidence that the commit exists.
    const evidence = await stateOf(
      newRepository(),
      clipFixture('processed', {
        status: 'processed',
        brainCommit: 'deadbee',
      }),
    )
    expect(evidence.state).toBe('inconsistent')
    expect(evidence.reason).toContain('deadbee')
  })
})

describe('deriveClipState, a thin clip', () => {
  it('calls a thin clip unreadable, not inconsistent', async () => {
    const thin: ThinClip = {
      kind: 'thin',
      directory: '/tmp/2026-07-28-042951-mobile',
      bucket: 'pending',
      reason: 'no metadata.json',
    }
    const evidence = await stateOf(newRepository(), thin)
    expect(evidence.state).toBe('unreadable')
    expect(evidence.reason).toBe('no metadata.json')
  })
})
