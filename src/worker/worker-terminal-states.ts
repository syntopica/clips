/** Job states after which a job never produces another result. A key held by
 * one of these with nothing left to collect is consumed, and resubmitting it
 * would only return the dead job. */
export const WORKER_TERMINAL_STATES: ReadonlySet<string> = new Set([
  'succeeded',
  'failed',
  'cancelled',
  'expired',
  'unacked_expired',
  'superseded',
])
