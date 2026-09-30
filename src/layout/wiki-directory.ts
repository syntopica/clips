import { join } from 'node:path'
import { currentWikiLayout } from './current-wiki-layout.ts'

/** The absolute page root of a checkout or an ingest worktree of the data
 * repository - the directory page paths and `sources:` entries resolve
 * against. */
export const wikiDirectory = (repository: string): string =>
  join(repository, currentWikiLayout().pageRoot)
