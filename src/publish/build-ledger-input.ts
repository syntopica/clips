import type { Clip } from '../clips/clip.ts'
import type { PagesRead } from '../reads/pages-read.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'

export type BuildLedgerInput = {
  clip: Clip
  clipSourcePath: string
  clipRepoCommit: string
  brainBaseCommit: string
  pagesTouched: string[]
  pagesRead: PagesRead
  identity: SynthesizerIdentity
}
