import { execFileSync } from 'node:child_process'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { write } from './validate-worktree-fixture-write.ts'

/** A brain whose committed state is a root map and nothing else, so
 * `index.md` is tracked exactly as it is in the real repository. */
export const newBrain = (): string => {
  const root = temporaryDir('clips-validate-')
  execFileSync('git', ['init', '-q', '-b', 'main', root])
  git(root, 'config', 'user.email', 'test@example.com')
  git(root, 'config', 'user.name', 'Test')
  write(root, 'index.md', '# Brain - index\n\n## Projects\n')
  write(root, 'README.md', '# readme\n')
  // A committed page that already points at the page these tests create. The
  // connect-or-shelve check needs an inbound link from a real page, and a link
  // from index.md deliberately does not count.
  write(root, 'projects/hub.md', '# Hub\n\nSee [[projects/pyfirma]].\n')
  git(root, 'add', '.')
  git(root, 'commit', '-qm', 'init')
  return root
}
