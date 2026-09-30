import { wikiPagePath } from '../layout/wiki-page-path.ts'

/** The `[[...]]` spelling of a repository page path: relative to the page
 * root, without `.md`. A path outside the page root keeps its own spelling,
 * which the validator then refuses as a dangling link. */
export const wikiLinkTarget = (path: string): string =>
  (wikiPagePath(path) ?? path).replace(/\.md$/, '')
