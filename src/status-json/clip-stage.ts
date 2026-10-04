/** Where in the pipeline a clip is, as `clips status --json --items` reports
 * it: `capture` cannot be read yet, `synthesis` waits for a model,
 * `publication` has a ledger not yet on origin, `reconciliation` is published
 * and waits to move to processed/, `operator` needs a person, `done` is
 * reconciled. */
export type ClipStage =
  | 'capture'
  | 'synthesis'
  | 'publication'
  | 'reconciliation'
  | 'operator'
  | 'done'
