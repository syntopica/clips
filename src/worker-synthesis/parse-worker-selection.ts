import { z } from 'zod'
import type { WorkerSelection } from './worker-selection.ts'

/** The selection answer, or null when it is not JSON of that shape. The
 * coordinator validated it against the same schema; this is the engine not
 * taking that on trust. */
export const parseWorkerSelection = (text: string): WorkerSelection | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  const result = z
    .object({
      pages: z.array(z.string()).max(2),
      needs_claude: z.boolean(),
      reason: z.string().max(2000),
    })
    .safeParse(parsed)
  return result.success ? result.data : null
}
