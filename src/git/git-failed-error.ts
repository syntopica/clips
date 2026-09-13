/** Fields are assigned in the constructor body, not declared as TypeScript
 * parameter properties: parameter properties are not erasable syntax, and
 * Node's native type-stripping (this package's runtime, see package.json's
 * "clips" script) rejects them at parse time with
 * ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX. tsc does not catch this without
 * erasableSyntaxOnly, so it only surfaces by actually running the CLI. */
export class GitFailedError extends Error {
  readonly args: string[]
  readonly exitCode: number
  readonly stderr: string

  constructor(args: string[], exitCode: number, stderr: string) {
    super(`git ${args.join(' ')} exited ${String(exitCode)}: ${stderr.trim()}`)
    this.name = 'GitFailedError'
    this.args = args
    this.exitCode = exitCode
    this.stderr = stderr
  }
}
