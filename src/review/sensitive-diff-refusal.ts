import { SENSITIVE_PAGE_DIRECTORIES } from '../grade/sensitive-page-directories.ts'

/** Why a diff must not be sent to an automatic reviewer, or null when it may
 * be.
 *
 * The grade lane got this guard on 2026-09-11, and this is the same rule seen
 * from the other end. A review prompt inlines the whole diff, so a synthesis
 * that touched `business/companies.md` would carry that page's changed lines -
 * credentials among them - to a model vendor, through a pass whose whole point
 * is that no person read it first.
 *
 * It reads the diff's own file headers rather than the run's declared page
 * list, because the header is what the transmitted text actually is. A match
 * escalates to a person instead of refusing outright: unlike grading, the work
 * still has to be decided, and a human gate is the reviewer these pages were
 * always supposed to get. */
export const sensitiveDiffRefusal = (diff: string): string | null => {
  for (const line of diff.split('\n')) {
    if (!line.startsWith('diff --git ')) continue
    const directory = SENSITIVE_PAGE_DIRECTORIES.find((prefix) =>
      line.includes(` a/${prefix}`),
    )
    if (directory !== undefined)
      return `the diff touches a ${directory} page, which is never sent to an automatic reviewer`
  }
  return null
}
