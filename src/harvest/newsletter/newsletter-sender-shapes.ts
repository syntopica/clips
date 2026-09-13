import type { SyntopicaConfig } from '../../config/syntopica-config.ts'
import { readSenderPairs } from './read-sender-pairs.ts'
import type { SenderShape } from './sender-shape.ts'

/** Every allowlisted sender of the selected instance and the shape its mail
 * takes, so a sender cannot be allowlisted without declaring how its mail
 * carries content. See `docs/newsletter-sender-cohorts.md` in the instance for
 * how the shapes were measured. */
export function newsletterSenderShapes(
  config: SyntopicaConfig,
): ReadonlyMap<string, SenderShape> {
  return new Map(
    readSenderPairs(config.newsletterAcceptedSenders).map(
      ([address, shape]) => [address, shape as SenderShape] as const,
    ),
  )
}
