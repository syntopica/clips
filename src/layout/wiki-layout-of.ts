import { dirname } from 'node:path'
import { InvalidSyntopicaConfigError } from '../config/invalid-syntopica-config-error.ts'
import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import { posixRelative } from './posix-relative.ts'
import type { WikiLayout } from './wiki-layout.ts'

/** The layout an instance's resolved paths describe. The page root is the
 * directory holding the index, because the index is the map every wikilink is
 * written against; a page directory outside it would have no page id, so it is
 * refused rather than guessed at. */
export const wikiLayoutOf = (
  config: Pick<
    SyntopicaConfig,
    'dataRoot' | 'pages' | 'sources' | 'index' | 'ledger'
  >,
): WikiLayout => {
  const root = dirname(config.index)
  const pageRoot = posixRelative(config.dataRoot, root)
  const pageDirectories = config.pages.map((page) => posixRelative(root, page))
  const escapes = [pageRoot, ...pageDirectories].some(
    (path) => path === '..' || path.startsWith('../'),
  )
  if (escapes || pageDirectories.includes(''))
    throw new InvalidSyntopicaConfigError(
      'brain.pages must sit under the directory holding brain.index, inside the data directory',
    )
  return {
    pageRoot,
    pageDirectories,
    index: posixRelative(root, config.index),
    sources: posixRelative(config.dataRoot, config.sources),
    ledger: posixRelative(config.dataRoot, config.ledger),
  }
}
