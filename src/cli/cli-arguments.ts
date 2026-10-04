export type CliArguments = {
  command:
    | 'pull'
    | 'status'
    | 'ingest'
    | 'harvest'
    | 'grade'
    | 'audit'
    | 'requeue'
    | 'reconcile'
    | 'drain'
    | 'help'
  clip: string | null
  limit: string | null
  dryRun: boolean
  grade: boolean
  /** `--json`: `clips status` prints one counts-only JSON document. */
  json: boolean
  /** `--items`: with `--json`, the document also lists waiting clips one by
   * one, by code, time and count only. */
  items: boolean
  manual: boolean
  promote: boolean
  captureAll: boolean
  source: string | null
  /** `--auto-review`: agy reads the ingest diff instead of prompting. */
  autoReview: boolean
  /** `--cited`: reconcile the pending clips whose urls the wiki already
   * cites. */
  cited: boolean
  date: string | null
  /** `--since`: read mail from this day instead of from the last newsletter
   * run, for a deliberate backfill wider than the default floor. */
  since: string | null
  pages: string[]
}
