/** The JSON Schema the writing pass answers in: every page it writes, whole,
 * with its path relative to the worktree, and for a new page the shown page
 * the engine should link it from. */
export const WORKER_WRITING_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['pages', 'needs_claude', 'reason'],
  properties: {
    pages: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'content'],
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
          link_from: { type: 'string' },
        },
      },
    },
    needs_claude: { type: 'boolean' },
    reason: { type: 'string' },
  },
}
