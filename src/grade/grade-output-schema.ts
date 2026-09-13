/** The JSON Schema handed to `codex exec --output-schema`. Kept as an object so
 * the runner can write it to a temp file and the parser can share the shape. */
export const GRADE_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    unsupported: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          why: { type: 'string' },
        },
        required: ['claim', 'why'],
        additionalProperties: false,
      },
    },
    uncheckable: { type: 'array', items: { type: 'string' } },
    misattributed: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          claim: { type: 'string' },
          marker: { type: 'string' },
          shouldBe: { type: ['string', 'null'] },
          why: { type: 'string' },
        },
        required: ['claim', 'marker', 'shouldBe', 'why'],
        additionalProperties: false,
      },
    },
    summary: { type: 'string' },
    verdict: { type: 'string', enum: ['clean', 'unsupported'] },
  },
  required: [
    'unsupported',
    'uncheckable',
    'misattributed',
    'summary',
    'verdict',
  ],
  additionalProperties: false,
} as const
