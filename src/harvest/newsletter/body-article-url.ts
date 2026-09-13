import { slugify } from '../promote/slugify.ts'

/** The synthetic identity of a body-content article:
 * `vexa://<sender-domain>/<sender-local>/<subject-slug>`.
 *
 * Sender+slug rather than a message id, for the three reasons the spec
 * amendment records: resends collapse at the existing dedup stage (OpenAI sent
 * one announcement three times), the identity survives a Vexa store rebuild,
 * and promotion can resolve it to the newest matching body. The domain is the
 * URL host so `buildClipMetadata`'s `site` reads as the sender's site rather
 * than a scheme artifact; the local part rides as the first path segment,
 * percent-encoded, because a `@` in the authority would read as userinfo and
 * normalization would silently drop it.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const bodyArticleUrl = (sender: string, subject: string): string => {
  const at = sender.lastIndexOf('@')
  const local = sender.slice(0, at)
  const domain = sender.slice(at + 1).toLowerCase()
  return `vexa://${domain}/${encodeURIComponent(local)}/${slugify(subject)}`
}
