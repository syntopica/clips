import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { wikiPages } from './wiki-pages.ts'

/** Every wiki page paired with its text, skipping a page whose file cannot be
 * read rather than throwing - what a caller does with an unreadable page is
 * its own finding to report, not this helper's problem to solve. */
export const pagesWithText = async (
  brainRepository: string,
): Promise<ReadonlyArray<readonly [page: string, text: string]>> => {
  const pages: Array<readonly [string, string]> = []
  for (const page of await wikiPages(brainRepository)) {
    const text = await readFile(join(brainRepository, page), 'utf8').catch(
      () => null,
    )
    if (text === null) continue
    pages.push([page, text])
  }
  return pages
}
