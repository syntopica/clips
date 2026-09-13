import type { Clip } from '../clips/clip.ts'
import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'

/** The reviewer's screen (SPEC:376-386): clip identity, route, pages, and a
 * diffstat. Untracked pages are made visible to `diff --stat` with
 * intent-to-add, which changes no content and is exactly what the later
 * staging will do anyway. Sanitizing happens in the terminal reviewer, not
 * here, so tests can assert on raw content. */
export const reviewSummary = async (
  worktree: string,
  clip: Clip,
  paths: string[],
): Promise<string> => {
  const intent = await runGit(worktree, ['add', '-N', '--', ...paths])
  if (intent.exitCode !== 0)
    throw new GitFailedError(['add -N'], intent.exitCode, intent.stderr)
  const stat = await runGit(worktree, [
    'diff',
    'HEAD',
    '--stat',
    '--',
    ...paths,
  ])
  if (stat.exitCode !== 0)
    throw new GitFailedError(['diff'], stat.exitCode, stat.stderr)
  const header = [
    `clip ${clip.metadata.clip_id.slice(0, 8)} . ${clip.metadata.site} . ${clip.metadata.title}`,
    `route: synthesis-candidate   pages: ${paths.join(', ')}`,
    '',
    stat.stdout.trimEnd(),
  ]
  return header.join('\n')
}
