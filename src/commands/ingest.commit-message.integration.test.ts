import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { installCommitMessageHook } from '../testing/install-commit-message-hook.ts'
import { BRAIN_ENGINE_PRESENT } from './brain-engine-present.ts'
import { CLIP_ID } from './ingest-test-clip-id.ts'
import { fixture } from './ingest-test-fixture.ts'
import { options } from './ingest-test-options.ts'
import { PAGE_BODY } from './ingest-test-page-body.ts'
import { verdictReviewer } from './ingest-test-verdict-reviewer.ts'
import { writingSynthesizer } from './ingest-test-writing-synthesizer.ts'
import { ingest } from './ingest.ts'

// The fixture copies the real index generator out of a brain checkout.
describe.skipIf(!BRAIN_ENGINE_PRESENT)('ingest commit messages', () => {
  it('routes a validation failure through a conventional-commit hook', async () => {
    const { brain, clips } = fixture()
    installCommitMessageHook(clips)
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY, 'secrets/evil.md'),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
    const message = git(clips, 'log', '-1', '--format=%B')
    expect(message).toContain('chore(clips): route clip')
    expect(message).toContain(CLIP_ID)
    expect(message).toContain('CONTENT_VALIDATION_FAILED')
    expect(git(clips, 'status', '--short')).toBe('')
    expect(git(clips, 'rev-parse', 'HEAD')).toBe(
      git(clips, 'rev-parse', 'origin/main'),
    )
  })

  it('reports the attempted message, both hook streams and the uncommitted move', async () => {
    const { brain, clips } = fixture()
    const before = git(clips, 'rev-parse', 'HEAD')
    installCommitMessageHook(clips, true)
    const failure = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY, 'secrets/evil.md'),
      grader: null,
      reviewer: verdictReviewer('apply'),
    }).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(Error)
    const message = (failure as Error).message
    expect(message).toContain('staged but uncommitted')
    expect(message).toContain(CLIP_ID)
    expect(message).toContain('CONTENT_VALIDATION_FAILED')
    expect(message).toContain('chore(clips): route clip')
    expect(message).toContain('[subject-empty]')
    expect(message).toContain('[type-empty]')
    expect(message).toContain(clips)
    expect(git(clips, 'rev-parse', 'HEAD')).toBe(before)
    expect(git(clips, 'rev-parse', 'origin/main')).toBe(before)
    expect(git(clips, 'diff', '--cached', '--name-only')).toContain(
      'clips/needs-claude/',
    )
  })
})
