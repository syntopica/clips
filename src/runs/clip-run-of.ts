import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import type { ClipRun } from './clip-run.ts'

/** The run history entry for one synthesis, timed by the caller around the
 * synthesizer alone. */
export const clipRunOf = (
  synthesis: SynthesisResult,
  startedAt: Date,
  finishedAt: Date,
): ClipRun => ({
  startedAt: startedAt.toISOString(),
  durationMs: finishedAt.getTime() - startedAt.getTime(),
  outcome: synthesis.skipped
    ? 'skipped'
    : synthesis.needsClaude
      ? 'escalated'
      : 'synthesized',
  model: synthesis.identity.model,
  boundary: synthesis.identity.boundary,
  workerJobIds: synthesis.workerJobIds ?? [],
  usage: synthesis.usage ?? null,
})
