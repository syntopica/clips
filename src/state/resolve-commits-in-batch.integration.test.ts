import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { initGitRepo } from '../testing/init-git-repo.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { resolveCommitsInBatch } from './resolve-commits-in-batch.ts'

const newRepository = (): { root: string; head: string; blob: string } => {
  const root = temporaryDir('batch-commits-')
  initGitRepo(root)
  writeFileSync(join(root, 'a.md'), 'one\n')
  git(root, 'add', '.')
  git(root, 'commit', '-qm', 'one')
  return {
    root,
    head: git(root, 'rev-parse', 'HEAD'),
    blob: git(root, 'rev-parse', 'HEAD:a.md'),
  }
}

describe('resolveCommitsInBatch', () => {
  it('resolves full and abbreviated commits to the full sha in one pass', async () => {
    const { root, head } = newRepository()
    const resolved = await resolveCommitsInBatch(root, [
      head,
      head.slice(0, 7),
      head,
    ])
    expect(resolved.get(head)).toBe(head)
    expect(resolved.get(head.slice(0, 7))).toBe(head)
    expect(resolved.size).toBe(2)
  })

  it('leaves out what does not resolve to a commit, and anything not hex', async () => {
    const { root, head, blob } = newRepository()
    const resolved = await resolveCommitsInBatch(root, [
      'deadbeefdeadbeef',
      blob,
      'main',
      `${head}\n${head}`,
      head,
    ])
    expect([...resolved.keys()]).toEqual([head])
  })

  it('answers an empty map without running git', async () => {
    const resolved = await resolveCommitsInBatch(
      join(temporaryDir('batch-none-'), 'absent'),
      [],
    )
    expect(resolved.size).toBe(0)
  })
})
