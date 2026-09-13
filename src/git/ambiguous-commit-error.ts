/** The field is assigned in the constructor body, not declared as a
 * TypeScript parameter property: parameter properties are not erasable
 * syntax, and Node's native type-stripping (this package's runtime, see
 * package.json's "clips" script) rejects them at parse time with
 * ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX. tsc does not catch this without
 * erasableSyntaxOnly, so it only surfaces by actually running the CLI. */
export class AmbiguousCommitError extends Error {
  readonly revision: string

  constructor(revision: string) {
    super(`ambiguous commit: ${revision}`)
    this.name = 'AmbiguousCommitError'
    this.revision = revision
  }
}
