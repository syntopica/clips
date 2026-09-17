import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { BRAIN_ENGINE_PRESENT } from './brain-engine-present.ts'
import { fixture } from './ingest-test-fixture.ts'
import { options } from './ingest-test-options.ts'
import { PAGE_BODY } from './ingest-test-page-body.ts'
import { PAGE } from './ingest-test-page.ts'
import { verdictReviewer } from './ingest-test-verdict-reviewer.ts'
import { writingSynthesizer } from './ingest-test-writing-synthesizer.ts'
import { ingest } from './ingest.ts'

// The fixture copies the real index generator out of a brain checkout.
describe.skipIf(!BRAIN_ENGINE_PRESENT)('clips ingest - the run lock', () => {
  it('is blocked by a live lock', async () => {
    const { brain, clips } = fixture()
    const { processStartTime } = await import('../lock/process-start-time.ts')
    const { hostname } = await import('node:os')
    mkdirSync(join(brain, '.ingest/lock'), { recursive: true })
    writeFileSync(
      join(brain, '.ingest/lock/owner.json'),
      JSON.stringify({
        pid: process.pid,
        hostname: hostname(),
        startedAt: new Date().toISOString(),
        processStartTime: await processStartTime(process.pid),
        command: 'clips ingest',
      }),
    )
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(3)
  })

  it('reclaims a stale lock from a dead process', async () => {
    const { brain, clips, brainOrigin } = fixture()
    const { hostname } = await import('node:os')
    mkdirSync(join(brain, '.ingest/lock'), { recursive: true })
    writeFileSync(
      join(brain, '.ingest/lock/owner.json'),
      JSON.stringify({
        pid: 999_999_999,
        hostname: hostname(),
        startedAt: '2026-01-01T00:00:00Z',
        processStartTime: 'long ago',
        command: 'clips ingest',
      }),
    )
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
    expect(git(brainOrigin, 'cat-file', '-e', `main:${PAGE}`)).toBe('')
    expect(existsSync(join(brain, '.ingest/lock'))).toBe(false)
  })
})
