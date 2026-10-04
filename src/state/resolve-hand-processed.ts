import { resolveBrainCommit } from './resolve-brain-commit.ts'
import type { StateEvidence } from './state-evidence.ts'

/** A clip whose state.json says processed while it still sits under pending/. */
export const resolveHandProcessed = async (
  brainRepository: string,
  brainCommit: string | null,
): Promise<StateEvidence> => {
  if (brainCommit === null) {
    return {
      state: 'inconsistent',
      code: 'processed_without_commit',
      reason: 'state.json says processed but records no brainCommit',
    }
  }
  const resolved = await resolveBrainCommit(brainRepository, brainCommit)
  return resolved.ok
    ? {
        state: 'reconciliation-pending',
        code: 'processed_under_pending',
        reason: `state.json says processed at ${resolved.sha} but the clip is still under pending/`,
      }
    : {
        state: 'inconsistent',
        code: 'commit_unresolved',
        reason: resolved.reason,
      }
}
