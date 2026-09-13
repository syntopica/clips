import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

/** Whether this filesystem advances a file's access time when it is read.
 *
 * Asked rather than assumed, because the answer is a property of the mount and
 * the pipeline has no say in it. APFS on the host this runs on does record
 * reads, verified in a real ingest worktree; a Linux host mounted `relatime`
 * updates atime only when it is older than mtime, and in a freshly checked-out
 * worktree that is true of no file at all. A check that silently reported an
 * empty read set there would be worse than no check, because an empty list is
 * an assertion.
 *
 * The probe reads a file that already exists rather than writing one, so it
 * leaves nothing behind for validation to find. Its own read is absorbed by
 * taking the baseline afterwards. */
export const recordsReads = async (
  worktree: string,
  file: string,
): Promise<boolean> => {
  const path = join(worktree, file)
  const before = await stat(path).catch(() => null)
  if (before === null) return false
  await readFile(path, 'utf8').catch(() => '')
  const after = await stat(path).catch(() => null)
  return after !== null && after.atimeMs > before.atimeMs
}
