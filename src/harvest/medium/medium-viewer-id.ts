import { VIEWER_ID_PATTERN } from './viewer-id-pattern.ts'

/** The signed-in user's id, read out of the `__APOLLO_STATE__` blob any
 * authenticated Medium page carries. Reading it beats hardcoding: the id is
 * whatever account the Chrome cookies belong to, and a hardcoded one would
 * silently harvest the wrong reading list if that ever changed. */
export const mediumViewerId = (html: string): string => {
  const match = VIEWER_ID_PATTERN.exec(html)
  if (match?.[1] === undefined)
    throw new Error(
      'No viewer id in the Medium page - the session is probably signed out.',
    )
  return match[1]
}
