import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'

/** A brain with one commit and no remote at all. */
export const newRepository = (): string => {
  const root = temporaryDir('clips-state-')
  execFileSync('git', ['init', '-q', '-b', 'main', root])
  git(root, 'config', 'user.email', 'test@example.com')
  git(root, 'config', 'user.name', 'Test')
  writeFileSync(join(root, 'index.md'), '# brain\n')
  git(root, 'add', '.')
  git(root, 'commit', '-qm', 'init')
  return root
}
