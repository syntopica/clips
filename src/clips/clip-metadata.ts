import type { z } from 'zod'
import type { ClipMetadataSchema } from './clip-metadata-schema.ts'

export type ClipMetadata = z.infer<typeof ClipMetadataSchema>
