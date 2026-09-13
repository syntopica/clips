import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { fixture } from './ingest-test-fixture.ts'
import { options } from './ingest-test-options.ts'
import { PAGE_BODY } from './ingest-test-page-body.ts'
import { SCRIPTED_IDENTITY } from './ingest-test-scripted-identity.ts'
import type { StateOnDisk } from './ingest-test-state-on-disk.ts'
import { verdictReviewer } from './ingest-test-verdict-reviewer.ts'
import { writingSynthesizer } from './ingest-test-writing-synthesizer.ts'
import { ingest } from './ingest.ts'

describe('clips ingest - routed to needs-claude by the validation gate', () => {
  it('routes a page outside the allowlist to needs-claude, brain untouched', async () => {
    const { brain, clips, brainOrigin } = fixture()
    const before = git(brainOrigin, 'rev-parse', 'main')
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY, 'secrets/evil.md'),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
    expect(git(brainOrigin, 'rev-parse', 'main')).toBe(before)
    const moved = git(clips, 'ls-files', 'clips/needs-claude')
    expect(moved).toContain('state.json')
    const stateFile = moved
      .split('\n')
      .find((line) => line.endsWith('state.json'))
    const state = JSON.parse(
      git(clips, 'show', `origin/main:${stateFile ?? ''}`),
    ) as StateOnDisk
    expect(state.status).toBe('needs-claude')
    expect(state.failure).toContain('phase4:error:')
    expect(state.failure).toContain('CONTENT_VALIDATION_FAILED')
  })

  it('routes a private clip to needs-claude without running synthesis', async () => {
    const { brain, clips } = fixture('private')
    let ran = false
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: {
        synthesize: async () => {
          ran = true
          return Promise.resolve({
            pagesTouched: [],
            needsClaude: false,
            skipped: false,
            reason: '',
            identity: SCRIPTED_IDENTITY,
          })
        },
      },
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
    expect(ran).toBe(false)
    expect(git(clips, 'ls-files', 'clips/needs-claude')).toContain(
      'metadata.json',
    )
  })

  it('refuses a new page no other page links to', async () => {
    const { brain, clips, brainOrigin } = fixture()
    const before = git(brainOrigin, 'rev-parse', 'main')
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY, 'topics/orphan.md'),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })

    // SCHEMA's connect-or-shelve rule at the gate. Batches 12, 13 and 14 each
    // published a page that broke it, every one found days later by the orphan
    // count rather than here.
    expect(exit).toBe(0)
    expect(git(brainOrigin, 'rev-parse', 'main')).toBe(before)
    expect(git(clips, 'ls-files', 'clips/needs-claude')).toContain('state.json')
  })
})
