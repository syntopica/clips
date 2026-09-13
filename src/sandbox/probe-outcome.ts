/**
 * How a probe command ended, judged from the child process alone.
 *
 * `inconclusive` is deliberately distinct from `denied`: a command that timed
 * out, was killed by a signal, or failed without a recognisable denial
 * signature tells us nothing about isolation, and must never be counted as
 * evidence that the boundary held.
 */
export type ProbeOutcome = 'succeeded' | 'denied' | 'inconclusive'
