import type { SyntopicaConfig } from '../../config/syntopica-config.ts'
import { newsletterSendersRejectedBooking } from './newsletter-senders-rejected-booking.ts'
import { readSenderPairs } from './read-sender-pairs.ts'

/** Senders considered for the allowlist and deliberately left off, with the
 * reason, joined with the separately filed booking cohort.
 *
 * Written down because the allowlist alone cannot say whether a sender was
 * judged and refused or simply never seen, and the next reader would otherwise
 * re-derive each of these from the mail store. */
export function newsletterSendersRejected(
  config: SyntopicaConfig,
): ReadonlyMap<string, string> {
  return new Map([
    ...readSenderPairs(config.newsletterRejectedSenders),
    ...newsletterSendersRejectedBooking(config),
  ])
}
