import type { Clip } from '../clips/clip.ts'
import { routeToNeedsClaude } from '../reconcile/route-to-needs-claude.ts'
import type { ClipOutcome } from './clip-outcome.ts'

/** The reviewer sent the clip to a human. The brain is left untouched and the
 * clip carries why, in the same failure shape synthesis and validation use, so
 * `clips status` reports one kind of escalation rather than three.
 *
 * The reason is carried rather than restated. It used to be a constant string,
 * which cost nothing while the only reviewer was a person at a terminal - they
 * know why they escalated. With `--auto-review` it discarded the one thing
 * worth keeping: an escalation from `diffNeedsHuman` (the diff creates a page
 * or touches `index.md`), one from the model's own judgement of the content,
 * and one from a transport that returned nothing all arrive here, and they call
 * for completely different work. */
export const routeEscalatedClip = async (
  clipsRepository: string,
  clip: Clip,
  reason: string,
  automatic: boolean,
): Promise<ClipOutcome> => {
  await routeToNeedsClaude(clipsRepository, clip, {
    stage: 'review',
    code: automatic ? 'AUTO_REVIEWER_ESCALATED' : 'REVIEWER_ESCALATED',
    message:
      reason === ''
        ? 'the reviewer escalated the clip'
        : `the reviewer escalated the clip: ${reason}`,
  })
  return 'needs-claude'
}
