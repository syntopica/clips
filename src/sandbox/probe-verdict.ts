import type { ProbeRowReport } from './probe-row-report.ts'

export type ProbeVerdict = {
  verdict: 'BOUNDARY_HOLDS' | 'BOUNDARY_FAILED'
  failureReason: string | null
  rows: ProbeRowReport[]
}
