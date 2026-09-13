import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { CLIP_ID } from './ingest-test-clip-id.ts'
import { fixture } from './ingest-test-fixture.ts'
import { options } from './ingest-test-options.ts'
import { PAGE_BODY } from './ingest-test-page-body.ts'
import { PAGE } from './ingest-test-page.ts'
import type { StateOnDisk } from './ingest-test-state-on-disk.ts'
import { verdictReviewer } from './ingest-test-verdict-reviewer.ts'
import { writingSynthesizer } from './ingest-test-writing-synthesizer.ts'
import { ingest } from './ingest.ts'

describe('clips ingest - publishing an approved synthesis', () => {
  it('publishes an approved synthesis and reconciles the clip', async () => {
    const { brain, clips, brainOrigin } = fixture()
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
    expect(git(brainOrigin, 'cat-file', '-e', `main:${PAGE}`)).toBe('')
    expect(
      git(brainOrigin, 'cat-file', '-e', `main:.ingest/clips/${CLIP_ID}.json`),
    ).toBe('')
    const processed = git(clips, 'ls-files', 'clips/processed')
    expect(processed).toContain('state.json')
    const stateFile = processed
      .split('\n')
      .find((line) => line.endsWith('state.json'))
    // Read the COMMITTED content on the pushed main, not the working tree:
    // git mv keeps the old blob for a modified file unless re-staged.
    const state = JSON.parse(
      git(clips, 'show', `origin/main:${stateFile ?? ''}`),
    ) as StateOnDisk
    expect(state.status).toBe('processed')
    expect(state.brainCommit).toBe(git(brainOrigin, 'rev-parse', 'main'))
    expect(git(brain, 'branch', '--list', 'ingest/*')).toBe('')
    expect(git(brain, 'rev-parse', 'main')).toBe(
      git(brainOrigin, 'rev-parse', 'main'),
    )
  })

  it('publishes an index.md derived from the new page, not written by the model', async () => {
    const { brain, clips, brainOrigin } = fixture()
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
    const index = git(brainOrigin, 'show', 'main:index.md')
    expect(index).toContain(
      '[[topics/test-topic]] — What the scripted synthesizer wrote.',
    )
    // The seeded `# brain` heading is gone: the generator owns the whole file,
    // so this is a regeneration rather than an amendment.
    expect(index).not.toContain('# brain')
  })

  it('records the transport that actually wrote the page', async () => {
    const { brain, clips, brainOrigin } = fixture()
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
    const ledger = JSON.parse(
      git(brainOrigin, 'show', `main:.ingest/clips/${CLIP_ID}.json`),
    ) as { synthesizer: { model: string; promptSha256: string } }

    // Until 2026-08-03 this was hard-coded to the interactive transport, so
    // every page codex or agy wrote was signed `claude-in-the-loop`.
    expect(ledger.synthesizer.model).toBe('scripted-model')
    expect(ledger.synthesizer.promptSha256).toBe('c'.repeat(64))
  })
})
