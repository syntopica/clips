import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { insertRelatedLink } from './insert-related-link.ts'
import { wikiLinkTarget } from './wiki-link-target.ts'
import type { WorkerPageWrite } from './worker-page-write.ts'

/** The writes with every new page linked from the shown page it names, or the
 * reason they cannot be.
 *
 * The engine adds the link rather than asking the model to: measured
 * 2026-09-30, the local 35B model created a page and returned nothing linking
 * to it in two runs of three, with the rule stated twice in the prompt, and the
 * validator refused both. Naming a page is a thing it does reliably; editing a
 * second page to hold one line is not.
 *
 * `link_from` must be one of `shown` - a page that exists and that the model
 * read - and a link to a page the answer also rewrites is added to that
 * rewrite, not to the file on disk it replaces. */
export const linkNewPages = async (
  worktree: string,
  writes: readonly WorkerPageWrite[],
  created: ReadonlySet<string>,
  shown: readonly string[],
): Promise<WorkerPageWrite[] | string> => {
  const result = writes.map((write) => ({ ...write }))
  for (const { path, link_from: from } of writes) {
    if (!created.has(path)) continue
    if (from === undefined || from === '')
      return `${path} is a new page and names no page to link it from`
    if (!shown.includes(from))
      return `${path} names ${from} to link it from, which is not a page the model was shown`
    let source = result.find((write) => write.path === from)
    if (source === undefined) {
      const content = await readFile(join(worktree, from), 'utf8').catch(
        () => null,
      )
      if (content === null) return `${from} does not exist to link ${path} from`
      source = { path: from, content }
      result.push(source)
    }
    source.content = insertRelatedLink(source.content, wikiLinkTarget(path))
  }
  return result
}
