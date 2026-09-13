import { git } from './git.ts'

/** Initializes a git repository at root with a fixed test identity, so a
 * fixture's first commit does not depend on the machine's global git
 * config. */
export const initGitRepo = (root: string): void => {
  git(root, 'init', '-q', '-b', 'main')
  git(root, 'config', 'user.email', 'test@example.com')
  git(root, 'config', 'user.name', 'Test')
}
