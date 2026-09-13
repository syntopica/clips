import { z } from 'zod'

/** The runtime validator for codex's schema-constrained final message; the
 * JSON Schema handed to --output-schema lives in codex-output-schema.ts and
 * the two describe the same shape. */
export const CodexFinalMessageSchema = z.object({
  pages_touched: z.array(z.string()),
  needs_claude: z.boolean(),
  reason: z.string().max(2000),
})
