import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { linkNewPages } from './link-new-pages.ts'
import { workerPagePathRefusal } from './worker-page-path-refusal.ts'
import type { WorkerPageWrite } from './worker-page-write.ts'
import { writeWorkerPage } from './write-worker-page.ts'

/** Write the model's pages into the worktree, returning the paths written, or
 * the reason none were.
 *
 * All or nothing: every path is checked, and every new page linked, before the
 * first byte is written, so a refused answer leaves the worktree exactly as it
 * was. Beyond the path check, an existing page may be replaced only if it was
 * one of `offered` - the pages the model was shown whole. A page it never saw
 * cannot be rewritten from its index line without losing what the index does
 * not say. A new page must name an offered page to be linked from, and
 * `linkNewPages` adds that link.
 *
 * What this does not check is the content. The hard validator runs on the
 * worktree afterwards, as it does for every transport: reviewed pages, dropped
 * `## Contested` entries, citation markers, unlinked new pages. */
export const applyWorkerPageWrites = async (
  worktree: string,
  writes: readonly WorkerPageWrite[],
  offered: readonly string[],
  directories: readonly string[],
): Promise<string[] | string> => {
  const seen = new Set<string>()
  const created = new Set<string>()
  for (const { path } of writes) {
    const refusal = workerPagePathRefusal(path, directories)
    if (refusal !== null) return refusal
    if (seen.has(path)) return `${path} is written twice`
    seen.add(path)
    const exists = await access(join(worktree, path)).then(
      () => true,
      () => false,
    )
    if (exists && !offered.includes(path))
      return `${path} already exists and was not among the pages the model was shown`
    if (!exists) created.add(path)
  }
  const linked = await linkNewPages(worktree, writes, created, offered)
  if (typeof linked === 'string') return linked
  for (const { path, content } of linked)
    await writeWorkerPage(worktree, path, content, created.has(path))
  return linked.map(({ path }) => path)
}
