import type { Clip } from '../clips/clip.ts'
import { stripControlCharacters } from '../clips/strip-control-characters.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import type { StateEvidence } from '../state/state-evidence.ts'
import { statusLineSubject } from './status-line-subject.ts'

/** The state name is ours and is the only field printed unsanitized. Both
 * page-derived strings pass through stripControlCharacters here, and there is
 * nowhere else for one to slip past. */
export const formatStatusLine = (
  clip: Clip | ThinClip,
  evidence: StateEvidence,
): string =>
  `${evidence.state.padEnd(23)} ${stripControlCharacters(statusLineSubject(clip))}\n    ${stripControlCharacters(evidence.reason)}`
