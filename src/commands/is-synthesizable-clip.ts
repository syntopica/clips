import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'

/** A clip the pipeline can actually hand to a synthesizer: full, and in a
 * derived state that asks to be processed. Written as a type guard so the loop
 * keeps its narrowing to `Clip` after the check - a thin clip has no metadata
 * to read. */
export const isSynthesizableClip = (
  clip: Clip | ThinClip,
  action: 'report' | 'skip' | 'process',
): clip is Clip => action === 'process' && clip.kind === 'clip'
