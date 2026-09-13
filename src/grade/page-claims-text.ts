/** The page with its `## Sources` section removed, which is the only part of a
 * page that makes no claims about the world.
 *
 * A sources list carries provenance about this pipeline's own capture history -
 * "(re-captured complete after the 2026-07-28 clip lost 4 truncated tweets)" is
 * the line that prompted this - and no cited article could ever support a
 * sentence about how it was cited. Graded, it reads as the page's single
 * unsupported claim, which is a finding about the grader rather than the page.
 *
 * It ends at the next `## ` heading rather than at the end of the file. Three
 * pages already carry a section after their sources list, appended by a later
 * batch, and those are ordinary prose that must still be graded. */
export const pageClaimsText = (page: string): string => {
  const lines = page.split('\n')
  const start = lines.findIndex((line) => /^## Sources\s*$/.test(line))
  if (start === -1) return page
  const rest = lines.slice(start + 1)
  const next = rest.findIndex((line) => line.startsWith('## '))
  return next === -1
    ? lines.slice(0, start).join('\n')
    : [...lines.slice(0, start), ...rest.slice(next)].join('\n')
}
