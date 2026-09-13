/** The clip's bytes changed after the ledger was written. Never reconciled
 * silently: SPEC:523-525. Task 7 builds one of these to phrase its evidence,
 * so the code and the wording have a single definition; plan 2b throws the
 * same class from `clips ingest`, where stopping is the right answer.
 *
 * Fields are assigned in the constructor body, not declared as TypeScript
 * parameter properties: parameter properties are not erasable syntax, and
 * Node's native type-stripping (this package's runtime, see package.json's
 * "clips" script) rejects them at parse time with
 * ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX. tsc does not catch this without
 * erasableSyntaxOnly, so it only surfaces by actually running the CLI. */
export class LedgerContentMismatchError extends Error {
  readonly code = 'LEDGER_CONTENT_MISMATCH'
  readonly clipId: string
  readonly recorded: string
  readonly recomputed: string

  constructor(clipId: string, recorded: string, recomputed: string) {
    super(
      `ledger for ${clipId} records ${recorded} but the clip hashes to ${recomputed}`,
    )
    this.name = 'LedgerContentMismatchError'
    this.clipId = clipId
    this.recorded = recorded
    this.recomputed = recomputed
  }
}
