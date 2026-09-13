import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Synthesizer } from '../synthesis/synthesizer.ts'
import { PAGE } from './ingest-test-page.ts'
import { SCRIPTED_IDENTITY } from './ingest-test-scripted-identity.ts'

export const writingSynthesizer = (body: string, page = PAGE): Synthesizer => ({
  synthesize: async ({ worktree }) => {
    mkdirSync(join(worktree, page, '..'), { recursive: true })
    writeFileSync(join(worktree, page), body)
    return Promise.resolve({
      pagesTouched: [],
      needsClaude: false,
      skipped: false,
      reason: 'scripted',
      identity: SCRIPTED_IDENTITY,
    })
  },
})
