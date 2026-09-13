import { runGit } from './run-git.ts'

/** A non-fast-forward means history was rewritten. Report and stop, never
 * merge or reset: SPEC:218-219. */
export const fastForward = async (
  repository: string,
  ref: string,
): Promise<void> => {
  const result = await runGit(repository, ['merge', '--ff-only', ref])
  if (result.exitCode !== 0) {
    throw new Error(
      `${repository} cannot fast-forward to ${ref}; history was rewritten. ${result.stderr.trim()}`,
    )
  }
}
