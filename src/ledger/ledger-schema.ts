import { z } from 'zod'
import { ULID_PATTERN } from '../clips/ulid-pattern.ts'

/** Written by the CLI only; codex never writes .ingest/. The brain commit sha
 * is deliberately absent, because the ledger is part of that very commit.
 * SPEC:489-516. */
export const LedgerSchema = z.object({
  schemaVersion: z.literal(1),
  clipId: z.string().regex(ULID_PATTERN),
  clipFormatVersion: z.number().int().positive(),
  contentSha256: z.string().length(64),
  clipRepoCommit: z.string().length(40),
  clipSourcePath: z.string(),
  brainBaseCommit: z.string().length(40),
  processedAt: z.string(),
  reviewedAt: z.string(),
  pagesTouched: z.array(z.string()),
  /** Optional because every ledger written before 2026-08-04 predates the
   * observation and has nothing to say; absent means unrecorded, which is not
   * the same as `'unobservable'` - that one was measured and came back blind. */
  pagesRead: z
    .union([z.array(z.string()), z.literal('unobservable')])
    .optional(),
  synthesizer: z.object({
    model: z.string(),
    promptSha256: z.string().length(64),
    toolVersion: z.string(),
    boundary: z.string(),
  }),
})
