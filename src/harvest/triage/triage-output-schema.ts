import { TRIAGE_TOPICS } from './triage-topic.ts'

/** Passed to `codex exec --output-schema`, which constrains the final message
 * to this shape. Constraining it at the tool layer beats asking for JSON in
 * prose: the model retries against the schema instead of returning something
 * that has to be repaired here. */
export const TRIAGE_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'bucket', 'topic', 'reason'],
        properties: {
          id: { type: 'integer' },
          bucket: { type: 'string', enum: ['ingest', 'review', 'rejected'] },
          topic: { type: 'string', enum: [...TRIAGE_TOPICS] },
          reason: { type: 'string' },
        },
      },
    },
  },
} as const
