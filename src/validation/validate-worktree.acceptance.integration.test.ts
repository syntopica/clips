import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { BRAIN } from './validate-worktree-fixture-brain-root.ts'
import { newBrain } from './validate-worktree-fixture-new-brain.ts'
import { PAGE_PATH } from './validate-worktree-fixture-page-path.ts'
import { PAGE } from './validate-worktree-fixture-page.ts'
import { write } from './validate-worktree-fixture-write.ts'
import { validateWorktree } from './validate-worktree.ts'

describe('validateWorktree: accepting and formatting valid pages', () => {
  it('accepts a new page on its own, with no index.md entry', async () => {
    const root = newBrain()
    write(root, PAGE_PATH, PAGE)
    expect(await validateWorktree(root, root)).toEqual({
      ok: true,
      paths: [PAGE_PATH],
    })
  })

  it('leaves an accepted page prettier-formatted', async () => {
    const root = newBrain()
    const unwrapped = `${PAGE}\nthis is a very long line of prose that should be wrapped by prettier because proseWrap is always and the print width is eighty characters.\n`
    write(root, PAGE_PATH, unwrapped)
    // The brain repository itself is the config anchor: an ingest worktree has
    // no node_modules, so only the real repo can resolve the prettier config
    // that `pnpm run check` enforces.
    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: true,
      paths: [PAGE_PATH],
    })
    expect(readFileSync(join(root, PAGE_PATH), 'utf8')).toBe(
      `${PAGE}\nthis is a very long line of prose that should be wrapped by prettier because\nproseWrap is always and the print width is eighty characters.\n`,
    )
  })

  it('still accepts an edit to an unmarked page', async () => {
    const root = newBrain()
    write(root, PAGE_PATH, PAGE)
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'page')
    write(root, PAGE_PATH, `${PAGE}\nsynthesized.\n`)
    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: true,
      paths: [PAGE_PATH],
    })
  })
})
