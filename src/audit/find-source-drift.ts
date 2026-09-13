import type { Clip } from '../clips/clip.ts'
import { contentSha256 } from '../clips/content-sha256.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import type { AuditFinding } from './audit-finding.ts'
import { collectLedgerFindings } from './collect-ledger-findings.ts'

/** Pages synthesized from a clip whose bytes have changed since.
 *
 * The ledger already records `contentSha256` of the clip directory as it stood
 * when the page was written, so the check is a rehash and a comparison - no new
 * field, no model, no network. What it catches is the failure the wiki cannot
 * see from the inside: a page that still reads as current while the source it
 * was compiled from has been re-clipped, corrected or truncated underneath it.
 *
 * A clip with no ledger has never been synthesized and is not drift. An
 * unreadable ledger is `clips status`'s problem, not this one, and is skipped
 * rather than reported twice. A clip whose directory can no longer be hashed at
 * all is reported, because a page citing it has lost its evidence entirely. */
export const findSourceDrift = async (
  brainRepository: string,
  clips: readonly (Clip | ThinClip)[],
): Promise<AuditFinding[]> => {
  return collectLedgerFindings(brainRepository, clips, async (clip, ledger) => {
    const current = await contentSha256(clip.directory).catch(() => null)
    if (current === null) {
      return [
        {
          check: 'source-drift',
          subject: clip.metadata.clip_id,
          detail: `the clip can no longer be hashed; ${ledger.pagesTouched.join(', ')} cite evidence that is not readable`,
        },
      ]
    }
    if (current === ledger.contentSha256) return []
    return [
      {
        check: 'source-drift',
        subject: clip.metadata.clip_id,
        detail: `content changed since synthesis (${ledger.contentSha256.slice(0, 12)} -> ${current.slice(0, 12)}); re-read ${ledger.pagesTouched.join(', ')}`,
      },
    ]
  })
}
