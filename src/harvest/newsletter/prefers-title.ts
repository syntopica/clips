import type { DigestLink } from './digest-link.ts'

/** Whether `candidate` is a better title for an article than `current`.
 *
 * Heading level decides first: Medium writes the title as `##` and the subtitle
 * as `###` on the same URL, so the shallower heading is the title by
 * construction. Length only breaks a tie. Getting this backwards classified 22%
 * of the measured harvest on a subtitle - and a subtitle like "Hi everyone, I am
 * Nitin Gavhane and In this blog I..." tells a classifier nothing, so the
 * article was rejected on the strength of a sentence that was never its title.
 * A link with no heading loses to any heading link. */
export const prefersTitle = (
  candidate: Pick<DigestLink, 'title' | 'headingLevel'>,
  current: Pick<DigestLink, 'title' | 'headingLevel'>,
): boolean => {
  const candidateLevel = candidate.headingLevel ?? Number.MAX_SAFE_INTEGER
  const currentLevel = current.headingLevel ?? Number.MAX_SAFE_INTEGER
  if (candidateLevel !== currentLevel) return candidateLevel < currentLevel
  return candidate.title.length > current.title.length
}
