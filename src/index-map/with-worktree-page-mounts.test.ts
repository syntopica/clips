import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { withWorktreePageMounts } from './with-worktree-page-mounts.ts'

describe('withWorktreePageMounts', () => {
  const mountPath = 'brain/shared/team/topics'
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'page-mounts-'))
    mkdirSync(join(root, 'data/brain/topics'), { recursive: true })
    mkdirSync(join(root, 'data', mountPath), { recursive: true })
    writeFileSync(join(root, 'data', mountPath, 'page.md'), '# Page\n')
    mkdirSync(join(root, 'worktree/brain/topics'), { recursive: true })
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('copies a page directory the worktree lacks only while the body runs', async () => {
    const data = join(root, 'data')
    const worktree = join(root, 'worktree')
    const mount = join(worktree, mountPath)
    const seen = await withWorktreePageMounts(
      data,
      [join(data, 'brain/topics'), join(data, mountPath)],
      worktree,
      async () => Promise.resolve(existsSync(join(mount, 'page.md'))),
    )
    expect(seen).toBe(true)
    expect(existsSync(join(worktree, 'brain/shared'))).toBe(false)
    expect(existsSync(join(data, mountPath, 'page.md'))).toBe(true)
    expect(readdirSync(join(worktree, 'brain/topics'))).toEqual([])
  })

  it('removes the copy when the body throws', async () => {
    const data = join(root, 'data')
    const worktree = join(root, 'worktree')
    await expect(
      withWorktreePageMounts(
        data,
        [join(data, mountPath)],
        worktree,
        async () => Promise.reject(new Error('builder failed')),
      ),
    ).rejects.toThrow('builder failed')
    expect(existsSync(join(worktree, mountPath))).toBe(false)
  })
})
