import { xThreadSourcePath } from '../audit/x-thread-source-path.ts'

/** The scraped thread file for every X status url a page cites, deduplicated.
 *
 * The audit learned to resolve an X url against `sources/x/` on 2026-08-11;
 * the grader never did — it resolved urls against clips alone and read local
 * evidence only when the `sources:` entry was written as a path. A page citing
 * a scraped thread by its url therefore audited clean and still graded
 * unsupported: measured 2026-08-22 on `topics/claude-skills-ecosystem.md`,
 * where a re-grade with both threads on disk cleared only 3 of 38 findings
 * because the grader never opened them. */
export const xThreadEvidencePaths = (
  brainRepository: string,
  sourceUrls: readonly string[],
): string[] => {
  const paths = new Set<string>()
  for (const url of sourceUrls) {
    const path = xThreadSourcePath(brainRepository, url)
    if (path !== null) paths.add(path)
  }
  return [...paths]
}
