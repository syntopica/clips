import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { deriveClipState } from './derive-clip-state.ts'
import type { StateEvidence } from './state-evidence.ts'

/** Derives state for a clip against the given brain and clips repository roots. */
export const stateOf = async (
  brain: string,
  clip: Clip | ThinClip,
): Promise<StateEvidence> =>
  deriveClipState({ clip, brainRepository: brain, clipsRepository: brain })
