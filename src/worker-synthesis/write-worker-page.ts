import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { restoreAppendOnlySources } from '../citations/restore-append-only-sources.ts'

/** Writes one page the worker returned. A rewrite that reordered `sources:`
 * gets the committed order back; see restoreAppendOnlySources for why that is
 * a repair and not a guess. A created page has no committed list. */
export const writeWorkerPage = async (
  worktree: string,
  path: string,
  content: string,
  created: boolean,
): Promise<void> => {
  const target = join(worktree, path)
  await mkdir(dirname(target), { recursive: true })
  const page = created
    ? content
    : restoreAppendOnlySources(await readFile(target, 'utf8'), content)
  await writeFile(target, page.endsWith('\n') ? page : `${page}\n`)
}
