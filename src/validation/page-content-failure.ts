import { frontmatterFailure } from './frontmatter-failure.ts'
import { readPageText } from './read-page-text.ts'

/** Null when the file on disk is an acceptable page body; otherwise why not.
 * The file-shape rules live in readPageText; what a page adds on top of them is
 * the frontmatter SCHEMA.md requires. */
export const pageContentFailure = async (
  worktree: string,
  path: string,
): Promise<string | null> => {
  const result = await readPageText(worktree, path)
  return result.ok ? frontmatterFailure(result.text) : result.failure
}
