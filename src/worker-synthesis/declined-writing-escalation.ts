import type { SynthesisResult } from '../synthesis/synthesis-result.ts'
import { workerSynthesisEscalation } from './worker-synthesis-escalation.ts'
import type { WorkerWriting } from './worker-writing.ts'

/** The escalation for a writing pass that declined - it asked for Claude, or
 * returned no pages - or null when it wrote something. An automated transport
 * may not skip a clip, so an empty answer escalates like the validation that
 * would refuse it, but carrying the model's own reason, which an empty
 * worktree otherwise loses (2026-10-05: qwen answered `pages: []` on two of the
 * first worker-ladder trial clips). */
export const declinedWritingEscalation = (
  writing: WorkerWriting,
  author: Parameters<typeof workerSynthesisEscalation>[1],
): SynthesisResult | null => {
  if (writing.needs_claude)
    return workerSynthesisEscalation(writing.reason, author)
  if (writing.pages.length === 0)
    return workerSynthesisEscalation(
      `the worker wrote no pages: ${writing.reason}`,
      author,
    )
  return null
}
