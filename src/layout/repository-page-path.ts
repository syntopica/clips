import { posix } from 'node:path'
import { currentWikiLayout } from './current-wiki-layout.ts'

/** A page path spelled the way git and the worktree see it. */
export const repositoryPagePath = (pagePath: string): string =>
  posix.join(currentWikiLayout().pageRoot, pagePath)
