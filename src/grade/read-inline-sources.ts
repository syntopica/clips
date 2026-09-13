import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import type { InlineSource } from './inline-source.ts'

/** Read every evidence file so it can be inlined, naming each by its path
 * relative to the repository it came from.
 *
 * A file that cannot be read is skipped rather than raised: the caller already
 * reports how many cited sources resolved on disk, and one unreadable clip must
 * not cost the whole page its grade. */
export const readInlineSources = async (
  root: string,
  paths: readonly string[],
): Promise<InlineSource[]> => {
  const sources: InlineSource[] = []
  for (const path of paths) {
    const text = await readFile(path, 'utf8').catch(() => null)
    if (text === null) continue
    sources.push({ name: relative(root, path) || path, text })
  }
  return sources
}
