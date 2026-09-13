import { writeFile } from 'node:fs/promises'
import type { Clip } from '../clips/clip.ts'
import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import { clipRelativePath } from '../reconcile/clip-relative-path.ts'
import { pushClipsRepository } from '../reconcile/push-clips-repository.ts'
import { readRejections } from './read-rejections.ts'
import { rejectionsPath } from './rejections-path.ts'

/** Append one rejection to the clip and push it, returning the new total.
 *
 * The retry loop is `routeToNeedsClaude`'s, and it is correct here for the same
 * reason: `pushClipsRepository` rewinds with `reset --hard` when the remote
 * advanced, so the re-read on the next attempt sees the file without this
 * entry and appends it exactly once. Re-reading inside the loop rather than
 * outside it is what makes that true - an append computed once and replayed
 * would duplicate.
 *
 * A rejection that cannot be pushed throws. Recording it locally and carrying
 * on would leave the next run to synthesize against a history no other checkout
 * has. */
export const recordRejection = async (
  clipsRepository: string,
  clip: Clip,
  reason: string,
): Promise<number> => {
  const path = rejectionsPath(clip.directory)
  const relative = `${clipRelativePath(clipsRepository, clip.directory)}/rejections.json`
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rejections = [
      ...(await readRejections(clip.directory)),
      { at: new Date().toISOString(), reason },
    ]
    await writeFile(path, `${JSON.stringify(rejections, null, 2)}\n`)
    const add = await runGit(clipsRepository, ['add', '--', relative])
    if (add.exitCode !== 0)
      throw new GitFailedError(['add'], add.exitCode, add.stderr)
    const commit = await runGit(clipsRepository, [
      'commit',
      '-q',
      '-m',
      `Record review rejection ${String(rejections.length)} for clip ${clip.metadata.clip_id}`,
    ])
    if (commit.exitCode !== 0)
      throw new GitFailedError(['commit'], commit.exitCode, commit.stderr)
    if (await pushClipsRepository(clipsRepository)) return rejections.length
  }
  throw new Error(
    `the clips repository kept advancing; the rejection of ${clip.metadata.clip_id} was not recorded`,
  )
}
