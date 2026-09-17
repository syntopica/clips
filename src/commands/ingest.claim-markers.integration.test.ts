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
describe.skipIf(!BRAIN_ENGINE_PRESENT)('clips ingest - claim markers', () => {
  it('publishes claim markers rewritten as links, not as the author wrote them', async () => {
    const { brain, clips, brainOrigin } = fixture()
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(
        `${PAGE_BODY}\nA claim [S1]. Something the owner knows [OWN].\n`,
      ),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)

    // The rewrite runs between validation and the review gate, so the reviewer
    // approves the text that lands rather than one thing while another ships.
    const published = git(brainOrigin, 'show', `main:${PAGE}`)
    expect(published).toContain('[[S1]](#sources)')
    expect(published).toContain('[[OWN]](#sources)')
  })

  it('refuses a marker naming a source the page does not have', async () => {
    const { brain, clips, brainOrigin } = fixture()
    const before = git(brainOrigin, 'rev-parse', 'main')
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(`${PAGE_BODY}\nA claim [S9].\n`),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
    expect(git(brainOrigin, 'rev-parse', 'main')).toBe(before)
    expect(git(clips, 'ls-files', 'clips/needs-claude')).toContain('state.json')
  })
})
