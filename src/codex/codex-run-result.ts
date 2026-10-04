import type { RunUsage } from '../runs/run-usage.ts'

/** `usage` is null when the transport printed none, or absent for a runner
 * that never reads it. */
export type CodexRunResult = {
  exitCode: number
  lastMessage: string | null
  stderrTail: string
  usage?: RunUsage | null
}
