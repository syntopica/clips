import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { BRAIN_ENGINE_PRESENT } from './brain-engine-present.ts'
import { fixture } from './ingest-test-fixture.ts'
import { options } from './ingest-test-options.ts'
import { PAGE_BODY } from './ingest-test-page-body.ts'
import { PAGE } from './ingest-test-page.ts'
import { SCRIPTED_IDENTITY } from './ingest-test-scripted-identity.ts'
import { verdictReviewer } from './ingest-test-verdict-reviewer.ts'
import { writingSynthesizer } from './ingest-test-writing-synthesizer.ts'
import { ingest } from './ingest.ts'

// The fixture copies the real index generator out of a brain checkout.
describe.skipIf(!BRAIN_ENGINE_PRESENT)(
  'clips ingest - repository consistency',
  () => {
    it('runs with a dirty brain the run does not touch', async () => {
      // Several sessions use this repository at once by design, so somebody
      // else's uncommitted edit is ordinary. Refusing on it blocked 18 of 25
      // clips on 2026-08-08 over a page no run would have touched, and the
      // fast-forward that ends the run would have succeeded.
      const { brain, clips } = fixture()
      writeFileSync(join(brain, 'someone-elses-draft.md'), 'x\n')
      const exit = await ingest({ brain, clips }, options, {
        synthesizer: writingSynthesizer(PAGE_BODY),
        grader: null,
        reviewer: verdictReviewer('apply'),
      })
      expect(exit).toBe(0)
      expect(existsSync(join(brain, 'someone-elses-draft.md'))).toBe(true)
    })

    it('dry-run changes nothing anywhere', async () => {
      const { brain, clips, brainOrigin } = fixture()
      const before = [
        git(brainOrigin, 'rev-parse', 'main'),
        git(clips, 'rev-parse', 'main'),
      ]
      const exit = await ingest(
        { brain, clips },
        { clipFilter: null, dryRun: true },
        {
          synthesizer: writingSynthesizer(PAGE_BODY),
          grader: null,
          reviewer: verdictReviewer('apply'),
        },
      )
      expect(exit).toBe(0)
      expect(git(brainOrigin, 'rev-parse', 'main')).toBe(before[0])
      expect(git(clips, 'rev-parse', 'main')).toBe(before[1])
      expect(git(clips, 'ls-files', 'clips/pending')).toContain('metadata.json')
      expect(existsSync(join(brain, '.ingest/lock'))).toBe(false)
    })

    it('dry-runs in a fresh wiki with no commit and no remote', async () => {
      // What `syntopica init` actually produces: a repository with neither a
      // commit nor an origin. The publication preflight refused it with `fatal:
      // ambiguous argument 'HEAD'`, so the first command the onboarding advertises
      // could not run.
      const brain = temporaryDir('ing-fresh-brain')
      const clips = temporaryDir('ing-fresh-clips')
      for (const repository of [brain, clips])
        execFileSync('git', [
          'init',
          '--quiet',
          '--initial-branch=main',
          repository,
        ])
      const exit = await ingest(
        { brain, clips },
        { clipFilter: null, dryRun: true },
        {
          synthesizer: writingSynthesizer(PAGE_BODY),
          grader: null,
          reviewer: verdictReviewer('apply'),
        },
      )
      expect(exit).toBe(0)
      expect(existsSync(join(brain, '.git/FETCH_HEAD'))).toBe(false)
    })

    it('recovers from a rejected push by cherry-picking onto the new origin/main', async () => {
      const { brain, clips, brainOrigin } = fixture()
      const synthesizer: Synthesizer = {
        synthesize: async ({ worktree }) => {
          mkdirSync(join(worktree, PAGE, '..'), { recursive: true })
          writeFileSync(join(worktree, PAGE), PAGE_BODY)
          // Another writer advances origin/main between worktree creation and
          // the push, so the first push is rejected.
          const other = temporaryDir('ing-other-')
          execFileSync('git', ['clone', '-q', brainOrigin, join(other, 'repo')])
          const repo = join(other, 'repo')
          git(repo, 'config', 'user.email', 'other@example.com')
          git(repo, 'config', 'user.name', 'Other')
          writeFileSync(join(repo, 'unrelated.md'), 'x\n')
          git(repo, 'add', '.')
          git(repo, 'commit', '-qm', 'unrelated')
          git(repo, 'push', '-q', 'origin', 'main')
          return Promise.resolve({
            pagesTouched: [],
            needsClaude: false,
            skipped: false,
            reason: 'scripted',
            identity: SCRIPTED_IDENTITY,
          })
        },
      }
      const exit = await ingest({ brain, clips }, options, {
        synthesizer,
        grader: null,
        reviewer: verdictReviewer('apply'),
      })
      expect(exit).toBe(0)
      expect(git(brainOrigin, 'cat-file', '-e', `main:${PAGE}`)).toBe('')
      expect(git(brainOrigin, 'cat-file', '-e', 'main:unrelated.md')).toBe('')
    })
  },
)
