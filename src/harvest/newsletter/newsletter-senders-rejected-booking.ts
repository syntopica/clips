import type { SyntopicaConfig } from '../../config/syntopica-config.ts'
import { readSenderPairs } from './read-sender-pairs.ts'

/** The rejected senders the instance files separately as live business
 * correspondence rather than bulk mail. Kept apart from the rest because the
 * distinction is about what the mail IS, not about the judgement. */
export function newsletterSendersRejectedBooking(
  config: SyntopicaConfig,
): readonly (readonly [string, string])[] {
  return readSenderPairs(config.newsletterRejectedBookingSenders)
}
