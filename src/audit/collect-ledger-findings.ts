import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import type { Ledger } from '../ledger/ledger.ts'
import { readLedgerSafely } from '../ledger/read-ledger-safely.ts'
import type { AuditFinding } from './audit-finding.ts'

/** Collects findings from full clips with readable ledgers in clip order. */
export const collectLedgerFindings = async (
  brainRepository: string,
  clips: readonly (Clip | ThinClip)[],
  inspect: (
    clip: Clip,
    ledger: Ledger,
  ) => AuditFinding[] | Promise<AuditFinding[]>,
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  for (const clip of clips) {
    if (clip.kind !== 'clip') continue
    const read = await readLedgerSafely(brainRepository, clip.metadata.clip_id)
    if (read.kind === 'readable')
      findings.push(...(await inspect(clip, read.ledger)))
  }
  return findings
}
