import { beginReadObservation } from '../reads/begin-read-observation.ts'
import { finishReadObservation } from '../reads/finish-read-observation.ts'
import type { PagesRead } from '../reads/pages-read.ts'
import { routeToNeedsClaude } from '../reconcile/route-to-needs-claude.ts'
import type { SynthesizerIdentity } from '../synthesis/synthesizer-identity.ts'
import { validateWorktree } from '../validation/validate-worktree.ts'
import type { ClipOutcome } from './clip-outcome.ts'
import { deriveWorktreePages } from './derive-worktree-pages.ts'
import type { SynthesizeAndValidateInput } from './synthesize-and-validate-input.ts'

/** Steps 6-7: run the synthesizer in the worktree, validate what it left there,
 * and derive from it. Returns the path set the reviewer sees and the committer
 * stages, or the clip's outcome when synthesis was skipped, escalated, or
 * anything failed - in which case the clip has already been routed and the
 * brain is untouched.
 *
 * The read observation brackets the synthesizer alone, and it has to: every
 * step below this one reads the whole worktree itself - validation walks each
 * page for its wikilinks, the map generator reads every `summary:` - so a
 * snapshot taken any later would report the CLI's own reads as the model's. */
export const synthesizeAndValidate = async (
  input: SynthesizeAndValidateInput,
): Promise<
  | { paths: string[]; pagesRead: PagesRead; identity: SynthesizerIdentity }
  | { outcome: ClipOutcome }
> => {
  const { repositories, clip, worktree, synthesizer, guidance } = input
  const observation = await beginReadObservation(worktree)
  const synthesis = await synthesizer.synthesize({
    clipDirectory: clip.directory,
    worktree,
    guidance,
  })
  const pagesRead = await finishReadObservation(worktree, observation)
  if (synthesis.skipped) return { outcome: 'skipped' }
  if (synthesis.needsClaude) {
    await routeToNeedsClaude(repositories.clips, clip, {
      stage: 'synthesis',
      code: 'MODEL_ESCALATED',
      message: synthesis.reason,
    })
    return { outcome: 'needs-claude' }
  }
  const validation = await validateWorktree(repositories.brain, worktree)
  if (!validation.ok) {
    await routeToNeedsClaude(repositories.clips, clip, {
      stage: 'validation',
      code: validation.failure.code,
      message: validation.failure.reason,
    })
    return { outcome: 'needs-claude' }
  }
  const derived = await deriveWorktreePages(
    repositories,
    clip,
    worktree,
    validation.paths,
  )
  if ('outcome' in derived) return derived
  return { paths: derived.paths, pagesRead, identity: synthesis.identity }
}
