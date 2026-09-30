import { posix } from 'node:path'

/** The repository paths a page named by the selection pass may mean, most
 * literal first.
 *
 * Measured 2026-09-30 on the local 35B model: asked for repository paths
 * ending `.md`, it answered `brain/projects/ai-text-watermarking` - the index's
 * link spelling with the root prefixed and no suffix. Both chosen pages were
 * then dropped as non-pages, the writing pass saw none, and it tried to link
 * its new page from one it had never been shown. So the answer is read
 * leniently here - wikilink brackets stripped, `.md` added, the page root
 * prefixed - and strictly everywhere after: each candidate still has to pass
 * the path check and exist. */
export const selectedPageCandidates = (
  named: string,
  pageRoot: string,
): string[] => {
  const bare = named.trim().replace(/^\[\[/, '').replace(/\]\]$/, '')
  const withSuffix = bare.endsWith('.md') ? bare : `${bare}.md`
  const candidates = [bare, withSuffix]
  if (pageRoot !== '' && !bare.startsWith(`${pageRoot}/`))
    candidates.push(posix.join(pageRoot, withSuffix))
  return [...new Set(candidates)]
}
