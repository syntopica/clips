import { posix } from 'node:path'
import { currentWikiLayout } from './current-wiki-layout.ts'

/** The index as git and the worktree see it. */
export const indexRepositoryPath = (): string => {
  const layout = currentWikiLayout()
  return posix.join(layout.pageRoot, layout.index)
}
