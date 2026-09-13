import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'

/** A clip this transport could not synthesize, routed to needs-claude with its
 * evidence.
 *
 * Every failure mode in `cursorSynthesizer` returns this shape and only the
 * reason differs, which is the point worth making structurally rather than by
 * repeating it four times: **no transport failure ever writes to the brain**.
 * An unreadable clip, an oversized one, a non-zero exit and an envelope with no
 * verdict are four different diagnoses of one outcome.
 *
 * `identity` is required rather than defaulted, because the two useful values
 * differ in a way a default would hide: a run that never sent a prompt carries
 * an empty `promptSha256`, and one that sent a prompt and failed carries the
 * real hash. The ledger needs to tell those apart. */
export const cursorEscalation = (
  reason: string,
  identity: SynthesizerIdentity,
): SynthesisResult => ({
  pagesTouched: [],
  needsClaude: true,
  skipped: false,
  reason,
  identity,
})
