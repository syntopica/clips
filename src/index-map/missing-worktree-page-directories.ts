import { existsSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'

/** The configured page directories the data directory has and the worktree
 * lacks, as paths relative to both.
 *
 * A page directory can be a mount: another repository checked out inside the
 * data directory and ignored by it, such as a brain shared with other people.
 * Git does not carry an ignored directory into a worktree, so it exists in the
 * instance and is absent from every ingest worktree. A directory outside the
 * data directory is not a mount of it and is left out. */
export const missingWorktreePageDirectories = (
  dataRoot: string,
  pages: readonly string[],
  worktree: string,
): string[] =>
  pages
    .map((directory) => relative(dataRoot, directory))
    .filter(
      (path) =>
        path !== '' &&
        !path.startsWith('..') &&
        !isAbsolute(path) &&
        existsSync(join(dataRoot, path)) &&
        !existsSync(join(worktree, path)),
    )
