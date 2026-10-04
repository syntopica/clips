import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import type { StateEvidence } from '../state/state-evidence.ts'

/** A discovered clip and the state derived for it, kept together so the item
 * list reuses the derivation the counts already paid for. */
export type EvaluatedClip = {
  clip: Clip | ThinClip
  evidence: StateEvidence
}
