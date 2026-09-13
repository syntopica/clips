import { parseAgyVerdictBody } from './parse-agy-verdict-body.ts'
import type { ReviewOutcome } from './review-outcome.ts'

/** Turn agy's answer into a review outcome, escalating anything it cannot read.
 *
 * Every unreadable shape becomes `claude`, never `apply` and never a silent
 * `skip`. agy exits 0 with an empty body when its quota is spent or when a
 * previous instance is still shutting down its language server, and counting
 * that as a verdict is exactly how a batch gets marked done having examined
 * nothing - the failure recorded on the 2026-08-04 curation pass. `quit` is
 * deliberately unreachable: ending the whole run is an operator decision. */
export const readAgyVerdict = (body: string | null): ReviewOutcome => {
  const parsed = parseAgyVerdictBody(body)
  if ('parseFailureReason' in parsed)
    return { verdict: 'claude', reason: parsed.parseFailureReason }
  const { verdict, reason } = parsed
  const why = typeof reason === 'string' ? reason : ''
  if (verdict === 'apply') return { verdict: 'apply', reason: '' }
  if (verdict === 'skip')
    return { verdict: 'skip', reason: why === '' ? 'no reason given' : why }
  return {
    verdict: 'claude',
    reason: why === '' ? 'agy escalated without a reason' : why,
  }
}
