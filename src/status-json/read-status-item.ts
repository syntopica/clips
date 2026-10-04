import { readLedgerSafely } from '../ledger/read-ledger-safely.ts'
import { readRejections } from '../rejections/read-rejections.ts'
import { readClipRuns } from '../runs/read-clip-runs.ts'
import type { EvaluatedClip } from './evaluated-clip.ts'
import { statusItemOf } from './status-item-of.ts'
import type { StatusItem } from './status-item.ts'

/** Read what an item needs beyond the derivation: the clip's run history, its
 * rejection count, and, once a ledger exists, the pages it touched. Each read
 * that fails reads as empty, as the derivation does: one bad file costs one
 * field, not the list. */
export const readStatusItem = async (
  brainRepository: string,
  runsDirectory: string | null,
  evaluated: EvaluatedClip,
): Promise<StatusItem> => {
  const { clip, evidence } = evaluated
  if (clip.kind === 'thin')
    return statusItemOf(evaluated, { runs: [], rejections: 0, pages: [] })
  const clipId = clip.metadata.clip_id
  const runs =
    runsDirectory === null ? [] : await readClipRuns(runsDirectory, clipId)
  const rejections = (await readRejections(clip.directory).catch(() => []))
    .length
  let pages: string[] = []
  if (evidence.state !== 'pending' && evidence.state !== 'needs-claude') {
    const ledger = await readLedgerSafely(brainRepository, clipId)
    if (ledger.kind === 'readable') pages = ledger.ledger.pagesTouched
  }
  return statusItemOf(evaluated, { runs, rejections, pages })
}
