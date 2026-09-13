import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { resolveSyntopicaPath } from './resolve-syntopica-path.ts'
import { runSyntopicaGit } from './run-syntopica-git.ts'

export function syntopicaGitCommonDirectory(root: string): string {
  const result = runSyntopicaGit(root, [
    'rev-parse',
    '--show-toplevel',
    '--git-common-dir',
  ])
  const lines = result.stdout.trim().split('\n')
  if (
    result.status !== 0 ||
    lines.length !== 2 ||
    !lines[0] ||
    !lines[1] ||
    resolveSyntopicaPath(lines[0]) !== root
  ) {
    throw new InvalidSyntopicaConfigError(
      'Each configured repository must be a Git worktree root',
    )
  }
  return resolveSyntopicaPath(lines[1], root)
}
