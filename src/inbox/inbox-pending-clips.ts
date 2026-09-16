import { join } from 'node:path'
import { readSubdirectories } from '../clips/read-subdirectories.ts'

/** The clip directories the browser clipper has committed to the inbox, as
 * inbox-relative paths `clips/pending/YYYY/MM/<directory>`. The clipper only
 * ever writes pending; anything else under the inbox's `clips/` is history
 * from before the archive moved into the instance and is not collected. */
export const inboxPendingClips = async (inbox: string): Promise<string[]> => {
  const found: string[] = []
  const pendingRoot = join(inbox, 'clips', 'pending')
  for (const year of await readSubdirectories(pendingRoot))
    for (const month of await readSubdirectories(join(pendingRoot, year.name)))
      for (const entry of await readSubdirectories(
        join(pendingRoot, year.name, month.name),
      ))
        found.push(join('clips', 'pending', year.name, month.name, entry.name))
  return found.sort()
}
