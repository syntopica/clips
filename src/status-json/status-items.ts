import { clipRunsDirectory } from '../runs/clip-runs-directory.ts'
import type { EvaluatedClip } from './evaluated-clip.ts'
import { readStatusItem } from './read-status-item.ts'
import { selectItemClips } from './select-item-clips.ts'
import type { StatusItem } from './status-item.ts'

/** The item list of `clips status --json --items`: every waiting clip and the
 * recently reconciled ones, in that order. */
export const statusItems = async (
  brainRepository: string,
  evaluated: readonly EvaluatedClip[],
): Promise<StatusItem[]> => {
  const runsDirectory = await clipRunsDirectory(brainRepository)
  const items: StatusItem[] = []
  for (const selected of selectItemClips(evaluated))
    items.push(await readStatusItem(brainRepository, runsDirectory, selected))
  return items
}
