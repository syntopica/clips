import { APOLLO_STATE_PATTERN } from './apollo-state-pattern.ts'

/** Turns a fetched Medium page into the flat `"<Type>:<id>" -> entry` map the
 * article extractor reads. A page without the state is not a transient parse
 * failure: it means the request was answered by the signed-out shell or the URL
 * was never an article, so it fails loudly instead of yielding an empty body
 * that would be promoted as a real clip.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const parseApolloState = (html: string): Record<string, unknown> => {
  const captured = APOLLO_STATE_PATTERN.exec(html)?.[1]
  if (captured === undefined)
    throw new Error(
      'No window.__APOLLO_STATE__ in the page: the Medium session is signed out or this URL is not an article',
    )

  const state: unknown = JSON.parse(captured)
  if (typeof state !== 'object' || state === null || Array.isArray(state))
    throw new Error(
      'window.__APOLLO_STATE__ did not parse to an object of cache entries',
    )
  return state as Record<string, unknown>
}
