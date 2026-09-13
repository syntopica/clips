import { join } from 'node:path'
import { readSortedEntries } from './read-sorted-entries.ts'

/** Every `<run-dir>/<run>.jsonl` under the store, in the order that makes the
 * last one win: lexicographic by run directory then by file, which is what
 * `tools/capture/classifications.py` does when it sorts its own run glob.
 * The run directory carries the date, so lexicographic is chronological. */
export const runVerdictFiles = async (root: string): Promise<string[]> => {
  const found: string[] = []
  for (const runDirectory of await readSortedEntries(root))
    for (const file of await readSortedEntries(join(root, runDirectory)))
      if (file.endsWith('.jsonl')) found.push(join(runDirectory, file))
  return found
}
