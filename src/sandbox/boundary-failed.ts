import type { ProbeRowReport } from './probe-row-report.ts'
import type { ProbeVerdict } from './probe-verdict.ts'

/** A failing verdict that always carries the rows it was judged from. */
export const boundaryFailed = (
  rows: ProbeRowReport[],
  failureReason: string,
): ProbeVerdict => ({
  verdict: 'BOUNDARY_FAILED',
  failureReason,
  rows,
})
