import type { CollectedDigestLinks } from '../collected-digest-links.ts'
import { bodyArticleUrl } from './body-article-url.ts'
import { collapseWhitespace } from './collapse-whitespace.ts'
import type { CollectDigestLinksInput } from './collect-digest-links-input.ts'
import type { DatedDigestLink } from './dated-digest-link.ts'
import { deduplicateDigestLinks } from './deduplicate-digest-links.ts'
import { extractDigestLinks } from './extract-digest-links.ts'
import type { SenderYield } from './sender-yield.ts'

/** Walk every allowlisted sender's mail and return the deduplicated articles.
 *
 * Reading is the cheap half of this lane: the bodies come from Vexa's local
 * store, so nothing here touches the network or a credential. A digest-links
 * sender's bodies are consumed and dropped as they arrive - only the extracted
 * links are kept, which is what lets a wide window run at all. A body-content
 * sender is cheaper still: each message *is* one article, so only its subject
 * and date are ever read, and the synthetic `vexa://` identity collapses
 * resends at the same dedup stage the link path uses.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const collectDigestLinks = (
  input: CollectDigestLinksInput,
): CollectedDigestLinks => {
  const links: DatedDigestLink[] = []
  const senders: SenderYield[] = []
  for (const [sender, shape] of input.senderShapes) {
    const before = links.length
    let emailCount = 0
    if (shape === 'digest-links') {
      for (const message of input.readDigests(sender)) {
        emailCount += 1
        for (const link of extractDigestLinks(message.body))
          links.push({ ...link, date: message.date, sender })
      }
    } else {
      for (const header of input.readBodyHeaders(sender)) {
        emailCount += 1
        const title = collapseWhitespace(header.subject)
        links.push({
          url: bodyArticleUrl(sender, title),
          title,
          headingLevel: null,
          date: header.date,
          sender,
        })
      }
    }
    senders.push({ sender, emailCount, linkCount: links.length - before })
  }
  return {
    articles: deduplicateDigestLinks(links),
    emailCount: senders.reduce((total, one) => total + one.emailCount, 0),
    linkCount: links.length,
    senders,
  }
}
