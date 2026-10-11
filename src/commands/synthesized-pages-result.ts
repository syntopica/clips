import type { PagesRead } from '../reads/pages-read.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'

export type SynthesizedPagesResult = {
  paths: string[]
  pagesRead: PagesRead
  identity: SynthesizerIdentity
}
