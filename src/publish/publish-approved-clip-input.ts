import type { PagesRead } from '../reads/pages-read.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'

export type PublishApprovedClipInput = {
  worktree: string
  validatedPaths: string[]
  baseSha: string
  clipRepoCommit: string
  pagesRead: PagesRead
  identity: SynthesizerIdentity
}
