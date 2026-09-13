/** The transport is injected rather than imported: this package has no HTTP
 * mocking and none may be added, so `post` is the seam tests stub with a
 * canned page sequence. It takes the serialized request body and the headers
 * `mediumGraphqlHeaders` produced, and returns the decoded JSON payload.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:116-181. */
export type FetchReadingListInput = {
  userId: string
  cookies: Map<string, string>
  post: (body: string, headers: Record<string, string>) => Promise<unknown>
}
