import { currentWikiLayout } from './current-wiki-layout.ts'

/** A repository path as a page path, or null when it lies outside the page
 * root and so names no page at all. */
export const wikiPagePath = (repositoryPath: string): string | null => {
  const { pageRoot } = currentWikiLayout()
  if (pageRoot === '') return repositoryPath
  return repositoryPath.startsWith(`${pageRoot}/`)
    ? repositoryPath.slice(pageRoot.length + 1)
    : null
}
