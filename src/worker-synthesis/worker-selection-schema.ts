/** The JSON Schema the selection pass answers in, sent with the job so the
 * coordinator validates the answer before this engine reads it. Two pages at
 * most: every page chosen is sent whole to the writing pass and comes back
 * rewritten, inside one fixed window. */
export const WORKER_SELECTION_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['pages', 'needs_claude', 'reason'],
  properties: {
    pages: { type: 'array', maxItems: 2, items: { type: 'string' } },
    needs_claude: { type: 'boolean' },
    reason: { type: 'string' },
  },
}
