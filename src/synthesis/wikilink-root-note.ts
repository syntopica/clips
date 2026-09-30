import { currentWikiLayout } from '../layout/current-wiki-layout.ts'

/** The sentence a synthesis prompt adds when the pages sit under a
 * subdirectory, or the empty string when they do not. A wikilink names a page
 * relative to the page root, and a model that sees `brain/topics/x.md` on disk
 * otherwise writes `[[brain/topics/x]]`, which resolves to nothing. */
export const wikilinkRootNote = (): string => {
  const { pageRoot, pageDirectories } = currentWikiLayout()
  const example = pageDirectories[0]
  if (pageRoot === '' || example === undefined) return ''
  return ` Wikilinks are relative to ${pageRoot}/: ${pageRoot}/${example}/name.md is [[${example}/name]].`
}
