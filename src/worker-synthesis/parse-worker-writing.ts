import { z } from 'zod'
import type { WorkerWriting } from './worker-writing.ts'

/** The writing answer, or null when it is not JSON of that shape. */
export const parseWorkerWriting = (text: string): WorkerWriting | null => {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  const result = z
    .object({
      pages: z
        .array(
          z.object({
            path: z.string(),
            content: z.string(),
            link_from: z.string().optional(),
          }),
        )
        .max(3),
      needs_claude: z.boolean(),
      reason: z.string().max(2000),
    })
    .safeParse(parsed)
  return result.success ? result.data : null
}
