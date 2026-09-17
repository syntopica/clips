import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { git } from '../testing/git.ts'
import { installCommitMessageHook } from '../testing/install-commit-message-hook.ts'
import { BRAIN_ENGINE_PRESENT } from './brain-engine-present.ts'
import { CLIP_ID } from './ingest-test-clip-id.ts'
import { CLIP_RELATIVE } from './ingest-test-clip-relative.ts'
import { discardKeptWorktree } from './ingest-test-discard-kept-worktree.ts'
import { fixture } from './ingest-test-fixture.ts'
import { options } from './ingest-test-options.ts'
import { PAGE_BODY } from './ingest-test-page-body.ts'
import { verdictReviewer } from './ingest-test-verdict-reviewer.ts'
import { writingSynthesizer } from './ingest-test-writing-synthesizer.ts'
import { ingest } from './ingest.ts'

const CLIPS_PENDING = 'clips/pending'

// The fixture copies the real index generator out of a brain checkout.
describe.skipIf(!BRAIN_ENGINE_PRESENT)(
  'clips ingest - the review gate rejects a draft',
  () => {
    it('leaves a skipped clip pending and the brain untouched', async () => {
      const { brain, clips, brainOrigin } = fixture()
      const before = git(brainOrigin, 'rev-parse', 'main')
      const exit = await ingest({ brain, clips }, options, {
        synthesizer: writingSynthesizer(PAGE_BODY),
        grader: null,
        reviewer: verdictReviewer('skip'),
      })
      expect(exit).toBe(0)
      expect(git(brainOrigin, 'rev-parse', 'main')).toBe(before)
      expect(git(clips, 'ls-files', CLIPS_PENDING)).toContain('metadata.json')
    })

    it('keeps the reviewer reason on a skipped clip and pushes it', async () => {
      const { brain, clips } = fixture()
      installCommitMessageHook(clips)
      const exit = await ingest({ brain, clips }, options, {
        synthesizer: writingSynthesizer(PAGE_BODY),
        grader: null,
        reviewer: verdictReviewer('skip'),
      })
      expect(exit).toBe(0)
      const recorded: unknown = JSON.parse(
        readFileSync(join(clips, CLIP_RELATIVE, 'rejections.json'), 'utf8'),
      )
      expect(recorded).toMatchObject([{ reason: 'scripted rejection' }])
      expect(git(clips, 'ls-files', CLIPS_PENDING)).toContain('rejections.json')
      expect(git(clips, 'status', '--short')).toBe('')
    })

    it('reports the branch a skipped run kept instead of dying inside git', async () => {
      const { brain, clips, brainOrigin } = fixture()
      const first = await ingest({ brain, clips }, options, {
        synthesizer: writingSynthesizer(PAGE_BODY),
        grader: null,
        reviewer: verdictReviewer('skip'),
      })
      expect(first).toBe(0)

      const before = git(brainOrigin, 'rev-parse', 'main')
      const written: string[] = []
      const stdout = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation((chunk: string | Uint8Array) => {
          written.push(String(chunk))
          return true
        })
      let exit: number
      try {
        // Re-running the same clip without the operator's cleanup used to reach
        // `git worktree add -b` and end the whole batch on `fatal: a branch named
        // 'ingest/<clip_id>' already exists`, before any synthesis.
        exit = await ingest({ brain, clips }, options, {
          synthesizer: {
            synthesize: () => {
              throw new Error('synthesis must not run on a kept branch')
            },
          },
          grader: null,
          reviewer: verdictReviewer('apply'),
        })
      } finally {
        stdout.mockRestore()
      }

      // 2, not 0: the clip stopped, which is the code that already means a clip
      // wants a person. What changed is that the run reaches its own summary
      // rather than throwing out of git.
      expect(exit).toBe(2)
      expect(written.join('')).toContain(
        `ingest/${CLIP_ID} kept by an earlier run`,
      )
      expect(written.join('')).toContain('worktree remove --force')
      expect(git(brainOrigin, 'rev-parse', 'main')).toBe(before)
      expect(git(clips, 'ls-files', CLIPS_PENDING)).toContain('metadata.json')

      discardKeptWorktree(brain)
    })

    it('routes a clip to needs-claude once the reviewer has rejected five drafts', async () => {
      const { brain, clips } = fixture()
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await ingest({ brain, clips }, options, {
          synthesizer: writingSynthesizer(PAGE_BODY),
          grader: null,
          reviewer: verdictReviewer('skip'),
        })
        // A skipped run keeps its worktree and branch on purpose, so abandoned
        // work is recoverable rather than destroyed. That makes clearing them the
        // operator's step before the same clip can be offered again, and this
        // loop is doing by hand what a person does between two real runs.
        discardKeptWorktree(brain)
      }
      expect(git(clips, 'ls-files', 'clips/needs-claude')).toContain(
        'rejections.json',
      )
      expect(git(clips, 'ls-files', CLIPS_PENDING)).toBe('')
    })
  },
)
