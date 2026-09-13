import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'

/** A working clone with one pushed commit and a real bare origin. */
export const repositoryWithOrigin = (
  prefix: string,
  seed: Record<string, string>,
): { clone: string; origin: string } => {
  const origin = temporaryDir(`${prefix}-origin-`)
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin])
  const clone = temporaryDir(`${prefix}-clone-`)
  const repo = join(clone, 'repo')
  execFileSync('git', ['init', '-q', '-b', 'main', repo])
  git(repo, 'remote', 'add', 'origin', origin)
  git(repo, 'config', 'user.email', 'test@example.com')
  git(repo, 'config', 'user.name', 'Test')
  for (const [name, body] of Object.entries(seed)) {
    mkdirSync(join(repo, name, '..'), { recursive: true })
    writeFileSync(join(repo, name), body)
  }
  git(repo, 'add', '.')
  git(repo, 'commit', '-qm', 'init')
  git(repo, 'push', '-q', '-u', 'origin', 'main')
  return { clone: repo, origin }
}
