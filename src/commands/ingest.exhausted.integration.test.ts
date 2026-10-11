import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { git } from '../testing/git.ts'
import { BRAIN_ENGINE_PRESENT } from './brain-engine-present.ts'
import { CLIP_RELATIVE } from './ingest-test-clip-relative.ts'
import { fixture } from './ingest-test-fixture.ts'
import { ingestInInstance } from './ingest-test-in-instance.ts'
import { options } from './ingest-test-options.ts'
import { SCRIPTED_IDENTITY } from './ingest-test-scripted-identity.ts'
import { verdictReviewer } from './ingest-test-verdict-reviewer.ts'

// The fixture copies the real index generator out of a brain checkout.
describe.skipIf(!BRAIN_ENGINE_PRESENT)(
  'clips ingest - exhausted transport',
  () => {
    it('stops the run with its own exit code and leaves the clip pending', async () => {
      const { brain, clips } = fixture()
      const written: string[] = []
      const stdout = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation((chunk: string | Uint8Array) => {
          written.push(String(chunk))
          return true
        })
      let exit: number
      try {
        exit = await ingestInInstance({ brain, clips }, options, {
          synthesizer: {
            synthesize: async () =>
              Promise.resolve({
                pagesTouched: [],
                needsClaude: false,
                skipped: true,
                exhausted: true,
                reason: 'writing: the local model overflowed',
                identity: SCRIPTED_IDENTITY,
              }),
          },
          grader: null,
          reviewer: verdictReviewer('apply'),
        })
      } finally {
        stdout.mockRestore()
      }

      expect(exit).toBe(EXIT_CODE.exhausted)
      expect(written.join('')).toMatch(/: exhausted\n/u)
      const state = JSON.parse(
        readFileSync(join(clips, CLIP_RELATIVE, 'state.json'), 'utf8'),
      ) as { status: string }
      expect(state.status).toBe('pending')
      expect(git(brain, 'branch', '--list', 'ingest/*')).toBe('')
    })
  },
)
