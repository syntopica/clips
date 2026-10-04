import { z } from 'zod'

export const RunUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  cachedInputTokens: z.number().nullable(),
  reasoningTokens: z.number().nullable(),
})
