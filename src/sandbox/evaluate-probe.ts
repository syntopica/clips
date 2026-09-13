import { boundaryFailed } from './boundary-failed.ts'
import type { ProbeRowReport } from './probe-row-report.ts'
import type { ProbeVerdict } from './probe-verdict.ts'

/**
 * Positive rows are judged first and on their own. If the shell never started,
 * every denial below is an artefact of nothing having run, and reading them as
 * evidence of isolation is the most dangerous false positive this probe exists
 * to prevent.
 */
export function evaluateProbe(rows: ProbeRowReport[]): ProbeVerdict {
  if (rows.length === 0) {
    return boundaryFailed(rows, 'the probe produced no rows')
  }

  for (const item of rows) {
    if (item.expected !== 'succeeded') continue
    if (item.actual !== 'succeeded') {
      return boundaryFailed(
        rows,
        `${item.id} was expected to succeed but was ${item.actual}`,
      )
    }
  }

  for (const item of rows) {
    if (item.expected !== 'denied') continue
    if (item.actual === 'succeeded') {
      return boundaryFailed(
        rows,
        `${item.id} was expected to be denied but succeeded`,
      )
    }
    if (item.actual === 'inconclusive') {
      return boundaryFailed(
        rows,
        `${item.id} was inconclusive, which is not a denial`,
      )
    }
  }

  return { verdict: 'BOUNDARY_HOLDS', failureReason: null, rows }
}
