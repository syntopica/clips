import { posix } from 'node:path'
import { currentWikiLayout } from './current-wiki-layout.ts'

/** The configured page directories as repository paths with a trailing
 * slash, the form a synthesis prompt names them in. */
export const repositoryPageDirectories = (): string[] => {
  const { pageRoot, pageDirectories } = currentWikiLayout()
  return pageDirectories.map((directory) =>
    posix.join(pageRoot, directory, '/'),
  )
}
