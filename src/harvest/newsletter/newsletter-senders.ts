import type { SyntopicaConfig } from '../../config/syntopica-config.ts'
import { newsletterSenderShapes } from './newsletter-sender-shapes.ts'

/** The sender allowlist of the selected instance, derived from the shape map so
 * the two cannot disagree. Deliberately explicit rather than a "looks like a
 * newsletter" heuristic: the same mailboxes carry invoices, receipts and
 * filings. */
export function newsletterSenders(config: SyntopicaConfig): readonly string[] {
  return [...newsletterSenderShapes(config).keys()]
}
