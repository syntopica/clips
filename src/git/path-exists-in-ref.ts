import { runGit } from './run-git.ts'

/** Is this path present in this ref? `cat-file -e <ref>:<path>` answers exactly
 * that, by exit code, with no history reasoning: 0 present, 128 absent.
 * Verified against a pushed and an unpushed path.
 *
 * A ref that does not exist also exits 128, so callers check refExists first;
 * otherwise "not fetched" and "not published" would be the same answer. `path`
 * is repository-relative with forward slashes - ledgerRelativePath gives it in
 * that spelling. */
export const pathExistsInRef = async (
  repository: string,
  ref: string,
  path: string,
): Promise<boolean> => {
  const result = await runGit(repository, ['cat-file', '-e', `${ref}:${path}`])
  return result.exitCode === 0
}
