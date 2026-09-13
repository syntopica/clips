/** The JSON Schema handed to `codex exec --output-schema`, constraining the
 * final message to SPEC:337-340's shape. Kept as an object so the runner can
 * write it to a temp file and the parser can share the field list. */
export const CODEX_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    pages_touched: { type: 'array', items: { type: 'string' } },
    needs_claude: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['pages_touched', 'needs_claude', 'reason'],
  additionalProperties: false,
} as const
