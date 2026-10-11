import { removedSectionsGuidance } from './removed-sections-guidance.ts'
import type { Synthesizer } from './synthesizer.ts'

/** A synthesis whose rewrite dropped a section an existing page already had
 * gets one more run, told what it dropped.
 *
 * Measured over the worker-ladder runs of 2026-10-05..11: 44 of the 68 clips
 * the validator parked had lost a section, the one refusal the model can fix by
 * being shown it - the clip is fine, the draft was not. Re-appending the lost
 * prose mechanically was rejected (decision 2026-10-11): the new draft may
 * restate or contradict it, and duplicate claims get past the validator. So
 * the worktree is reset and the model writes again, and the validator judges
 * the second draft exactly as it would have the first. One retry, not a loop;
 * an escalation or a skip is a verdict and is never repeated. */
export const retryRemovedSections = (
  inner: Synthesizer,
  refusal: (worktree: string) => Promise<string | null>,
  discard: (worktree: string) => Promise<void>,
): Synthesizer => ({
  synthesize: async (input) => {
    const first = await inner.synthesize(input)
    if (first.needsClaude || first.skipped) return first
    const why = await refusal(input.worktree)
    if (why === null) return first
    process.stderr.write(
      'synthesis dropped an existing section - running it once more\n',
    )
    await discard(input.worktree)
    return inner.synthesize({
      ...input,
      guidance: removedSectionsGuidance(input.guidance, why),
    })
  },
})
