import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import type { CitedCandidate } from './cited-candidate.ts'
import { stageClipMove } from './stage-clip-move.ts'

/** Move every cited candidate from `pending/` to `processed/` under one
 * commit. One commit rather than one per clip because this pass runs at corpus
 * scale - per-clip commits would put hundreds of pushes between the first move
 * and the last, and the interleaving window is what `reconcileClip`'s
 * one-at-a-time shape already fights. The state each clip receives is the same
 * one `reconcileClip` writes: processed, no failure, the brain commit its
 * ledger landed in. */
export const moveCitedClipsProcessed = async (
  clipsRepository: string,
  candidates: readonly CitedCandidate[],
  brainCommit: string,
): Promise<void> => {
  const state = `${JSON.stringify(
    {
      status: 'processed',
      updatedAt: new Date().toISOString(),
      failure: null,
      brainCommit,
    },
    null,
    2,
  )}\n`
  for (const candidate of candidates) {
    await stageClipMove({
      clipsRepository,
      clipDirectory: candidate.clip.directory,
      sourceBucket: 'pending',
      destinationBucket: 'processed',
      state,
    })
  }
  const commit = await runGit(clipsRepository, [
    'commit',
    '-q',
    '-m',
    `Mark ${String(candidates.length)} cited clips processed into the brain`,
  ])
  if (commit.exitCode !== 0)
    throw new GitFailedError(['commit'], commit.exitCode, commit.stderr)
}
