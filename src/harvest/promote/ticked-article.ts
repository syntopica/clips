/** An article the user ticked in a triage file, ready for `--promote` to fetch
 * and ingest. Only what promotion needs: the classifier's reason and bucket
 * were advice for the human, and the tick supersedes both.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export type TickedArticle = {
  url: string
  title: string
  topic: string
}
