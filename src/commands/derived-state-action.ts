import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import type { StateEvidence } from '../state/state-evidence.ts'

/** What the ingest loop does with a clip in this derived state: report it
 * (thin or inconsistent), skip it silently (already settled), or hand it to
 * the pipeline. */
export const derivedStateAction = (
  clip: Clip | ThinClip,
  evidence: StateEvidence,
): 'report' | 'skip' | 'process' => {
  if (clip.kind === 'thin' || evidence.state === 'inconsistent') return 'report'
  if (evidence.state === 'reconciled' || evidence.state === 'needs-claude')
    return 'skip'
  return 'process'
}
