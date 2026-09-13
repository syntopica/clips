import { z } from 'zod'

/** Copied from brain-clipper's src/shared/clip-state-schema.ts. It carries no
 * version field; SPEC:205-207 records that as a gap in that project and
 * requires this parser to be defensive rather than solving it here. */
export const ClipStateSchema = z.object({
  status: z.enum(['pending', 'processed', 'needs-claude']),
  updatedAt: z.string(),
  failure: z.string().nullable(),
  brainCommit: z.string().nullable(),
})
