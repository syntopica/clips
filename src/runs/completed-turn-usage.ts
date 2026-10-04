import type { ReportedTurnUsage } from './reported-turn-usage.ts'

/** The usage of one `codex exec --json` line when it is a `turn.completed`
 * event, else null. A line that is not JSON is null too: codex can print
 * warnings among the events. */
export const completedTurnUsage = (line: string): ReportedTurnUsage | null => {
  if (!line.startsWith('{')) return null
  let event: unknown
  try {
    event = JSON.parse(line)
  } catch {
    return null
  }
  if (typeof event !== 'object' || event === null) return null
  const { type, usage } = event as { type?: unknown; usage?: unknown }
  if (type !== 'turn.completed' || typeof usage !== 'object' || usage === null)
    return null
  return usage
}
