import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import type { CollectedDigestLinks } from './collected-digest-links.ts'
import { collectDigestLinks } from './newsletter/collect-digest-links.ts'
import { newsletterSenderShapes } from './newsletter/newsletter-sender-shapes.ts'
import { readVexaBodyHeaders } from './read-vexa-body-headers.ts'
import { readVexaDigests } from './read-vexa-digests.ts'

/** The newsletter sweep with its failure already handled: Vexa's store being
 * absent or locked costs this source, not the run, and the caller sees an empty
 * result plus a printed reason rather than an exception.
 *
 * Both transports are generators, so they open the database on the first
 * message rather than at the call - which means a store failure surfaces inside
 * `collectDigestLinks` and lands in this catch either way. */
export const collectNewsletterArticles = (
  since: string,
): CollectedDigestLinks | null => {
  try {
    return collectDigestLinks({
      readDigests: (sender) => readVexaDigests(sender, since),
      readBodyHeaders: (sender) => readVexaBodyHeaders(sender, since),
      senderShapes: newsletterSenderShapes(currentSyntopicaConfig()),
    })
  } catch (error) {
    process.stderr.write(
      `newsletter collector skipped: ${error instanceof Error ? error.message : String(error)}\n`,
    )
    return null
  }
}
