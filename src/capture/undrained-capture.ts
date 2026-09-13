import type { z } from 'zod'
import type { UndrainedCaptureSchema } from './undrained-capture-schema.ts'

export type UndrainedCapture = z.infer<typeof UndrainedCaptureSchema>
