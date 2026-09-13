/** The topics a harvested article is filed under, one markdown file each.
 *
 * Kept deliberately short: these are the user's standing interests, not a
 * taxonomy of the internet. `other` absorbs everything that does not fit rather
 * than growing the list.
 *
 * The two music topics were added on 2026-08-07, when the owner opened the
 * music branch of the wiki ([[personal/artist]]): he is a working
 * latino-electrónico singer, DJ and producer, and the harvest lane was
 * rejecting that half of his mail because the classifier had only ever been
 * told he is a developer. `music-production` is the craft - mixing, mastering,
 * DAWs, plugins, sound design. `music-business` is everything around it -
 * distribution, streaming and playlist growth, promotion, labels, rights,
 * booking and live.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const TRIAGE_TOPICS = [
  'ai-agents',
  'llm-engineering',
  'saas',
  'seo',
  'devtools',
  'music-production',
  'music-business',
  'other',
] as const
