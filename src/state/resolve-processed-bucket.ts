import type { ClipState } from '../clips/clip-state.ts'
import { resolveBrainCommit } from './resolve-brain-commit.ts'
import type { StateEvidence } from './state-evidence.ts'

/** A clip under processed/. Sitting in that directory is a claim, not evidence:
 * the sha is resolved here exactly as it is under pending/, and the resolved
 * full sha goes into the reason so `clips status` shows what was checked. The
 * status field has to agree with the directory too, or the two sources of truth
 * disagree and only a human can say which is right. */
export const resolveProcessedBucket = async (
  brainRepository: string,
  clipState: ClipState,
): Promise<StateEvidence> => {
  if (clipState.status !== 'processed') {
    return {
      state: 'inconsistent',
      reason: `under processed/ but state.json says ${clipState.status}`,
    }
  }
  if (clipState.brainCommit === null)
    return {
      state: 'inconsistent',
      reason: 'under processed/ with no brainCommit',
    }

  const resolved = await resolveBrainCommit(
    brainRepository,
    clipState.brainCommit,
  )
  return resolved.ok
    ? { state: 'reconciled', reason: `under processed/ at ${resolved.sha}` }
    : {
        state: 'inconsistent',
        reason: `under processed/ but ${resolved.reason}`,
      }
}
