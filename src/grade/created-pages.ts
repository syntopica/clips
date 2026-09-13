import { pathExistsInRef } from '../git/path-exists-in-ref.ts'

/** Which of a synthesis's validated paths are pages that did not exist before
 * the run, measured against the commit its worktree branched from.
 *
 * The grade pass costs a codex run per page on top of the synthesis run, so
 * grading every touched page doubles the quota a clip costs. A new page is
 * where that spend buys the most: none of its text has been read by a grader
 * before, whereas an updated page is mostly text an earlier pass already
 * cleared. */
export const createdPages = async (
  brainRepository: string,
  baseSha: string,
  paths: readonly string[],
): Promise<string[]> => {
  const created: string[] = []
  for (const path of paths) {
    if (!(await pathExistsInRef(brainRepository, baseSha, path)))
      created.push(path)
  }
  return created
}
