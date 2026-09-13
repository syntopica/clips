/** The decoded form of what `structuredFailure` writes into
 * `ClipStateSchema.failure`. `retryable` is carried because the wire format has
 * it, not because it can be trusted: every caller of `routeToNeedsClaude`
 * passes `false`, so the field says nothing today and the requeue decision is
 * made from `code`. */
export type StructuredFailureRecord = {
  version: number
  stage: string
  code: string
  message: string
  retryable: boolean
  occurredAt: string
}
