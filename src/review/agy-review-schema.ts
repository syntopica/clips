/** The shape agy must answer the review gate in.
 *
 * `claude` is in the enum on purpose: a reviewer that can only say yes or no
 * has to guess when it is unsure, and this pipeline already has a lane for
 * "a person should look at this". */
export const AGY_REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'reason'],
  properties: {
    verdict: { type: 'string', enum: ['apply', 'skip', 'claude'] },
    reason: { type: 'string', maxLength: 400 },
  },
}
