/** Segment-level judgement for a candidate page path: null when acceptable.
 * Split from pagePathFailure so each rule set stays readable. */
export const pagePathSegmentsFailure = (segments: string[]): string | null => {
  if (segments.some((segment) => segment === '' || segment === '.'))
    return 'non-normalized path'
  if (segments.includes('..')) return 'path escapes the repository'
  if (segments.some((segment) => segment.startsWith('.')))
    return 'hidden file or directory'
  if (segments.length < 2) return 'a bare directory, not a page'
  return null
}
