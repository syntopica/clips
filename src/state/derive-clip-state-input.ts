import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'

export type DeriveClipStateInput = {
  clip: Clip | ThinClip
  brainRepository: string
  clipsRepository: string
}
