import { parseStructuredFailure } from '../reconcile/parse-structured-failure.ts'
import type { ClipRun } from '../runs/clip-run.ts'
import { clipCapturedAt } from './clip-captured-at.ts'
import { clipUpdatedAt } from './clip-updated-at.ts'
import type { EvaluatedClip } from './evaluated-clip.ts'
import { opaqueClipId } from './opaque-clip-id.ts'
import { stageOfState } from './stage-of-state.ts'
import type { StatusItem } from './status-item.ts'

/** One item, from the derivation and what was read beside it. The structured
 * failure keeps its stage and code and drops its message, which can quote the
 * model and through it the clip. */
export const statusItemOf = (
  { clip, evidence }: EvaluatedClip,
  read: { runs: readonly ClipRun[]; rejections: number; pages: string[] },
): StatusItem => {
  const failure =
    clip.kind === 'clip' ? parseStructuredFailure(clip.state.failure) : null
  const capturedAt = clipCapturedAt(clip)
  const updatedAt = clipUpdatedAt(clip)
  return {
    id: opaqueClipId(clip),
    state: evidence.state,
    reason: evidence.code,
    failure:
      failure === null ? null : { stage: failure.stage, code: failure.code },
    stage: stageOfState(evidence.state),
    capturedAt: capturedAt === null ? null : new Date(capturedAt).toISOString(),
    lastTransitionAt:
      updatedAt === null ? null : new Date(updatedAt).toISOString(),
    attempts: read.runs.length > 0 ? read.runs.length : read.rejections,
    lastRun: read.runs.at(-1) ?? null,
    pages: read.pages,
  }
}
