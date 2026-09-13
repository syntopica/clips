/** The three destinations a harvested article can land in.
 *
 * `review` exists because the classifier is instructed to prefer it whenever it
 * is unsure: a wrong `review` costs the user one line of reading, a wrong
 * `rejected` loses the article silently.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export type TriageBucket = 'ingest' | 'review' | 'rejected'
