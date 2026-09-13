import type { z } from 'zod'
import type { ClipStateSchema } from './clip-state-schema.ts'

export type ClipState = z.infer<typeof ClipStateSchema>
