/** The reading list operation is reconstructed from Medium's client bundles,
 * not published, so a GraphQL validation error means the schema moved under
 * us. That must fail the run loudly with the returned message rather than be
 * swallowed into an empty harvest, which would look like "nothing saved this
 * week" forever. The bundle-mining procedure to re-derive the query is in
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:118-181.
 *
 * Fields are assigned in the constructor body rather than declared as
 * TypeScript parameter properties: parameter properties are not erasable
 * syntax and Node's native type-stripping, this package's runtime, rejects
 * them with ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX. */
export class MediumGraphqlError extends Error {
  readonly code = 'MEDIUM_GRAPHQL'
  readonly messages: string[]

  constructor(messages: string[]) {
    super(`Medium GraphQL rejected the operation: ${messages.join('; ')}`)
    this.name = 'MediumGraphqlError'
    this.messages = messages
  }
}
