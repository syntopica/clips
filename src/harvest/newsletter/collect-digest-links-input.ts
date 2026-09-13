import type { BodyHeader } from './body-header.ts'
import type { DigestBody } from './digest-body.ts'
import type { SenderShape } from './sender-shape.ts'

/** The mail transport is injected rather than imported, matching how the rest
 * of this package takes its I/O as parameters: tests hand in canned fixtures
 * instead of reading a mail client's local database.
 *
 * Both readers hand back an iterable rather than an array so the collector can
 * stream. A wide window is tens of thousands of messages carrying hundreds of
 * megabytes of HTML, and collecting them before converting any is what makes
 * the run die of memory rather than run slowly. `readBodyHeaders` never
 * touches a body at all - a body-content candidate is its subject and date
 * until the moment it is promoted.
 *
 * The allowlist arrives the same way, since 2026-09-13: it is one instance's
 * subscriptions, so importing it would put them in the engine. */
export type CollectDigestLinksInput = {
  readDigests: (sender: string) => Iterable<DigestBody>
  readBodyHeaders: (sender: string) => Iterable<BodyHeader>
  senderShapes: ReadonlyMap<string, SenderShape>
}
