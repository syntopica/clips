import { readdir } from 'node:fs/promises'

/** Directory entries, sorted, with an absent or unreadable directory treated
 * as empty. The classification store is optional: a clips repository that has
 * never been classified is not an error. */
export const readSortedEntries = async (
  directory: string,
): Promise<string[]> => {
  try {
    return (await readdir(directory)).sort()
  } catch {
    return []
  }
}
