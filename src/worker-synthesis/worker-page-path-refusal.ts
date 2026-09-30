import { posix } from 'node:path'

/** Why the model's `path` may not be written, or null when it names a
 * markdown file inside one of the page directories.
 *
 * The model's answer is the only thing that chooses a path here, and the clip
 * it read may have been written to steer it, so the path is checked as text
 * before anything touches the disk: relative, already normalised, no `..`,
 * under a page directory, ending `.md`. `directories` are repository paths
 * with a trailing slash, as `repositoryPageDirectories` gives them. */
export const workerPagePathRefusal = (
  path: string,
  directories: readonly string[],
): string | null => {
  if (
    path === '' ||
    posix.isAbsolute(path) ||
    posix.normalize(path) !== path ||
    path.split('/').includes('..')
  )
    return `${JSON.stringify(path)} is not a plain relative path`
  if (!path.endsWith('.md'))
    return `${JSON.stringify(path)} is not a markdown page`
  if (!directories.some((directory) => path.startsWith(directory)))
    return `${JSON.stringify(path)} is outside the page directories`
  return null
}
