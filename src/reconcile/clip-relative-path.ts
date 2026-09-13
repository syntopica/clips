import { relative, sep } from 'node:path'

/** The clip directory as a repository-relative, forward-slash path, the
 * spelling both git pathspecs and the ledger's clipSourcePath use. Throws if
 * the directory is not inside the repository - moving a path outside the
 * clips repo is a programming error, not a data condition. */
export const clipRelativePath = (
  clipsRepository: string,
  clipDirectory: string,
): string => {
  const path = relative(clipsRepository, clipDirectory)
  if (path.startsWith('..') || path === '') {
    throw new Error(`${clipDirectory} is not inside ${clipsRepository}`)
  }
  return path.split(sep).join('/')
}
