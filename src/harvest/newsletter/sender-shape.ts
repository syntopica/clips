/** How an allowlisted sender's mail carries its content: `digest-links` mail is
 * a list of links to articles hosted elsewhere, `body-content` mail *is* the
 * article. The shape decides which collector path a sender's messages take.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export type SenderShape = 'digest-links' | 'body-content'
