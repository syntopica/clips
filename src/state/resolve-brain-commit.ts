import { AmbiguousCommitError } from '../git/ambiguous-commit-error.ts'
import { resolveCommit } from '../git/resolve-commit.ts'
import type { ResolvedBrainCommit } from './resolved-brain-commit.ts'

/** An abbreviated sha is read for legacy compatibility and rewritten in full at
 * reconciliation. Ambiguous stays distinct from missing, because the two are
 * different failures for the operator to act on, and neither is ever guessed
 * at. Shared by both processed arms so a sha recorded under processed/ gets
 * exactly the same scrutiny as the same sha under pending/. */
export const resolveBrainCommit = async (
  brainRepository: string,
  brainCommit: string,
): Promise<ResolvedBrainCommit> => {
  try {
    return { ok: true, sha: await resolveCommit(brainRepository, brainCommit) }
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof AmbiguousCommitError
          ? `brainCommit ${brainCommit} is ambiguous`
          : `brainCommit ${brainCommit} does not resolve`,
    }
  }
}
