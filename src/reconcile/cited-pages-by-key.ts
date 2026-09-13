import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { wikiPages } from '../audit/wiki-pages.ts'
import { citationDedupKey } from '../grade/citation-dedup-key.ts'
import { pageSourceUrls } from '../grade/page-source-urls.ts'

/** Every `sources:` url in the wiki as a dedup key, mapped to the pages that
 * cite it. Keys rather than raw urls for the same reason `evidenceClipPaths`
 * uses them: one Medium post reaches a page and the store under different
 * spellings, and comparing verbatim was measured dropping eight of ten
 * resolvable citations on 2026-08-04. An unreadable page is skipped - this map
 * feeds a bookkeeping pass, and one bad page must cost its own entries, not
 * the run. */
export const citedPagesByKey = async (
  brainRepository: string,
): Promise<Map<string, string[]>> => {
  const cited = new Map<string, string[]>()
  for (const page of await wikiPages(brainRepository)) {
    const text = await readFile(join(brainRepository, page), 'utf8').catch(
      () => null,
    )
    if (text === null) continue
    for (const url of pageSourceUrls(text)) {
      const key = citationDedupKey(url)
      const pages = cited.get(key) ?? []
      if (!pages.includes(page)) pages.push(page)
      cited.set(key, pages)
    }
  }
  return cited
}
