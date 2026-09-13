import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import type { StateEvidence } from '../state/state-evidence.ts'

/** Prints the one line a clip gets when the loop will not touch it, and says
 * whether that counts as a stopped clip (only `inconsistent` does - decision 4
 * of milestone 2a, same as `clips status`). */
export const reportUnprocessableClip = (
  clip: Clip | ThinClip,
  evidence: StateEvidence,
): boolean => {
  const name = clip.kind === 'thin' ? clip.directory : clip.metadata.clip_id
  process.stdout.write(`${name}: ${evidence.state} (${evidence.reason})\n`)
  return evidence.state === 'inconsistent'
}
