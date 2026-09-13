import { execFileSync } from 'node:child_process'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { newRepository } from './clip-state-fixture-new-repository.ts'

/** The same brain, cloned from a real bare origin, so origin/main is a genuine
 * remote tracking ref. */
export const newRepositoryWithOrigin = (): string => {
  const origin = temporaryDir('clips-origin-')
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin])
  const brain = newRepository()
  git(brain, 'remote', 'add', 'origin', origin)
  git(brain, 'push', '-q', '-u', 'origin', 'main')
  return brain
}
