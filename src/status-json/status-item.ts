import type { ClipRun } from '../runs/clip-run.ts'
import type { DerivedState } from '../state/derived-state.ts'
import type { StateReasonCode } from '../state/state-reason-code.ts'
import type { ClipStage } from './clip-stage.ts'

/** One clip in `clips status --json --items`. Codes, counts, times and ids the
 * engine or the worker minted; never the clip's title, url, text, its clip id
 * or a failure message, which can quote the clip.
 *
 * `pages` is the exception worth naming: the brain pages a published clip
 * touched, as the ledger records them. They are page paths, not clip content,
 * and they are what a consumer links the result to. */
export type StatusItem = {
  /** A digest of the clip id (or, for a clip with no metadata, of its
   * directory): stable across runs, and not the clip id itself. */
  id: string
  state: DerivedState
  reason: StateReasonCode
  /** The structured failure on a routed clip: its stage and code only. */
  failure: { stage: string; code: string } | null
  stage: ClipStage
  capturedAt: string | null
  /** state.json's `updatedAt`: when the clip last changed bucket or status. */
  lastTransitionAt: string | null
  /** Synthesis runs recorded for the clip, or, before runs were recorded, the
   * drafts a reviewer turned down. */
  attempts: number
  lastRun: ClipRun | null
  pages: string[]
}
