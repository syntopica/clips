import { readFileSync } from 'node:fs'

import { BoundaryDecisionSchema } from './boundary-decision-schema.ts'
import type { BoundaryDecision } from './boundary-decision.ts'
import { PROBE_ASSERTIONS } from './probe-assertions.ts'

/**
 * Re-checks the recorded rows rather than trusting the recorded verdict. The
 * file is the only thing standing between an untrusted web page and a model
 * that can read this machine, so a hand-edited `CODEX_ENABLED` with no evidence
 * behind it must not be enough.
 *
 * Importing `PROBE_ASSERTIONS` couples this check to the current assertion
 * table on purpose: adding a tenth assertion later retroactively invalidates
 * a previously valid enabled decision, because that decision's rows no longer
 * cover the full table. That is the intended fail-closed direction, not a bug.
 *
 * CODEX_OPERATOR_OVERRIDE is the one decision that carries no evidence by
 * design: it records that the operator explicitly accepted running codex with
 * filesystem reads open (2026-07-28), so there are no probe rows to check -
 * the justification field is the record, and the row validation below would
 * be theater. It still runs codex under its native workspace-write sandbox
 * (writes confined, command network denied); only the read boundary is
 * waived.
 */
export function readBoundaryDecision(path: string): BoundaryDecision {
  const decision = BoundaryDecisionSchema.parse(
    JSON.parse(readFileSync(path, 'utf8')),
  )
  if (decision.decision !== 'CODEX_ENABLED') return decision

  if (decision.rows.length === 0) {
    throw new Error(
      'an enabled decision must carry the probe rows that justify it',
    )
  }
  for (const row of decision.rows) {
    if (row.expected !== row.actual) {
      throw new Error(
        `enabled decision contradicted by row ${row.id}: ${row.actual}`,
      )
    }
  }
  const recordedIds = new Set(decision.rows.map((row) => row.id))
  const missingIds = PROBE_ASSERTIONS.map((assertion) => assertion.id).filter(
    (id) => !recordedIds.has(id),
  )
  if (missingIds.length > 0) {
    throw new Error(
      `enabled decision is missing probe rows: ${missingIds.join(', ')}`,
    )
  }
  const assertionsById = new Map(
    PROBE_ASSERTIONS.map((assertion) => [assertion.id, assertion]),
  )
  for (const row of decision.rows) {
    const assertion = assertionsById.get(row.id)
    if (assertion !== undefined && row.expected !== assertion.expected) {
      throw new Error(
        `enabled decision row ${row.id} claims expected '${row.expected}' but the probe table ` +
          `defines '${assertion.expected}' for that assertion`,
      )
    }
  }
  if (decision.mechanism === 'none') {
    throw new Error(
      'an enabled decision requires a mechanism that actually ran codex',
    )
  }
  return decision
}
