import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import type { MoveClipInput } from './move-clip-input.ts'
import { stageClipMove } from './stage-clip-move.ts'

/** One deterministic move in the clips repository: rewrite state.json, git mv
 * the directory to its destination bucket, commit. The caller owns push and
 * retry. The staged half lives in `stageClipMove`, shared with the cited
 * reconcile, which stages many moves under one commit. */
export const moveClip = async (input: MoveClipInput): Promise<void> => {
  await stageClipMove(input)
  const commit = await runGit(input.clipsRepository, [
    'commit',
    '-q',
    '-m',
    input.subject,
  ])
  if (commit.exitCode !== 0)
    throw new GitFailedError(['commit'], commit.exitCode, commit.stderr)
}
