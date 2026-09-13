import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import { clipRelativePath } from './clip-relative-path.ts'
import { rebucketedPath } from './rebucketed-path.ts'
import type { StageClipMoveInput } from './stage-clip-move-input.ts'

/** The staged half of one clip move: rewrite state.json, git mv the directory
 * to its destination bucket, stage the rewritten file. The caller owns the
 * commit, which is what lets `moveClip` commit one move and the cited
 * reconcile commit hundreds in one. Collision handling per SPEC:450-454: an
 * occupied destination is an error and nothing is ever overwritten - `git mv`
 * refuses an existing destination on its own, and that refusal is surfaced,
 * not forced. */
export const stageClipMove = async (
  input: StageClipMoveInput,
): Promise<void> => {
  const { clipsRepository, clipDirectory, destinationBucket } = input
  const source = clipRelativePath(clipsRepository, clipDirectory)
  const destination = rebucketedPath(
    source,
    input.sourceBucket,
    destinationBucket,
  )
  await writeFile(join(clipDirectory, 'state.json'), input.state)
  // git mv does not create intermediate directories for its destination.
  await mkdir(dirname(join(clipsRepository, destination)), { recursive: true })
  const move = await runGit(clipsRepository, ['mv', source, destination])
  if (move.exitCode !== 0)
    throw new GitFailedError(['mv'], move.exitCode, move.stderr)
  // git mv stages the rename but keeps the OLD blob for a file modified in
  // the worktree (verified empirically), so the rewritten state.json must be
  // staged explicitly or the pushed clip would still claim its prior status.
  const add = await runGit(clipsRepository, [
    'add',
    '--',
    `${destination}/state.json`,
  ])
  if (add.exitCode !== 0)
    throw new GitFailedError(['add'], add.exitCode, add.stderr)
}
