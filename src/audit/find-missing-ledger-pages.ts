import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import type { AuditFinding } from './audit-finding.ts'
import { collectLedgerFindings } from './collect-ledger-findings.ts'

/** Ledgers claiming a page that is no longer there.
 *
 * A page moves - `topics/pyfirma.md` became `business/pyfirma.md` during the
 * vault fold - and the ledger keeps pointing at where it used to be. Nothing
 * breaks loudly: the clip still reads as processed, and the drift check
 * cheerfully prints "re-read topics/pyfirma.md" at a path that has not existed
 * for days. That is how this check was found, by following one of its own
 * findings and getting `page not found` from the grader.
 *
 * A ledger is history and is not rewritten to match the move; the finding is
 * the point, because the pair of them - old ledger, moved page - is what tells
 * a reader the two are the same work. */
export const findMissingLedgerPages = async (
  brainRepository: string,
  clips: readonly (Clip | ThinClip)[],
): Promise<AuditFinding[]> => {
  return collectLedgerFindings(brainRepository, clips, (clip, ledger) => {
    const gone = ledger.pagesTouched.filter(
      (page) => !existsSync(join(brainRepository, page)),
    )
    if (gone.length === 0) return []
    return [
      {
        check: 'missing-ledger-page',
        subject: clip.metadata.clip_id,
        detail: `the ledger claims ${gone.join(', ')}, which no longer exists; the page was renamed or deleted after publication`,
      },
    ]
  })
}
