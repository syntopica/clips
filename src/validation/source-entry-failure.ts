import { frontmatterListLines } from '../audit/frontmatter-list-lines.ts'
import { readPageText } from './read-page-text.ts'
import { sourceListTokenIsMissing } from './source-list-token-is-missing.ts'

/** Null when no `sources:` entry starts with a claim marker; otherwise which
 * line does.
 *
 * The measured corruption, not a shape whitelist: on 2026-08-18 four of seven
 * needs-claude escalations were a synthesis writing `- [S129] https://...`
 * into the sources list - the marker belongs in prose, and as a list entry its
 * first token becomes the source value, silently shifting the position of
 * every entry after it. The wiki's grandfathered entries are urls, repo paths,
 * emails, bare domains and prose descriptions, so requiring a url-or-path
 * shape here would refuse every edit to those pages - the always-fires check
 * this repository has switched off once. A leading claim marker has no
 * legitimate reading, so that exact shape is what the gate refuses. */
export const sourceEntryFailure = async (
  worktree: string,
  path: string,
): Promise<string | null> => {
  const result = await readPageText(worktree, path)
  if (!result.ok) return null
  for (const line of frontmatterListLines(result.text, 'sources')) {
    const token = /^\s*-\s+(\S+)/.exec(line)?.[1]
    if (sourceListTokenIsMissing(token)) continue
    if (/^\[(?:S\d+|SNEW|OWN)\]/.test(token))
      return `sources entry starts with a claim marker: ${line.trim()}`
  }
  return null
}
