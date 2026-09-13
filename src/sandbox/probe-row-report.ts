import type { ProbeOutcome } from './probe-outcome.ts'

export type ProbeRowReport = {
  id: string
  expected: 'succeeded' | 'denied'
  actual: ProbeOutcome
  exitCode: number | null
  signal: string | null
  stderrExcerpt: string
}
