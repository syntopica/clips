import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { BRAIN } from './validate-worktree-fixture-brain-root.ts'
import { newBrain } from './validate-worktree-fixture-new-brain.ts'
import { PAGE_PATH } from './validate-worktree-fixture-page-path.ts'
import { PAGE } from './validate-worktree-fixture-page.ts'
import { write } from './validate-worktree-fixture-write.ts'
import { validateWorktree } from './validate-worktree.ts'

describe('validateWorktree: section and contested-belief preservation', () => {
  it('refuses a change that drops a section the page already had', async () => {
    // Measured 2026-08-08: a synthesis took eleven lines of
    // topics/launch-checklists.md with it, the whole WordPress/Elementor
    // section, while its diff read as a healthy set of insertions.
    const root = newBrain()
    write(
      root,
      PAGE_PATH,
      `${PAGE}\n## Launch checklist\n\nThe durable extras live here.\n`,
    )
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'page')
    write(root, PAGE_PATH, `${PAGE}\n## Something else\n\nAdded.\n`)

    const result = await validateWorktree(BRAIN, root)
    expect(result.ok).toBe(false)
    expect(JSON.stringify(result)).toContain('Launch checklist')
  })

  it('lets a change that only adds a section through', async () => {
    const root = newBrain()
    write(root, PAGE_PATH, `${PAGE}\n## Kept\n\nOriginal.\n`)
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'page')
    write(
      root,
      PAGE_PATH,
      `${PAGE}\n## Kept\n\nOriginal.\n\n## New\n\nWhat the clip taught.\n`,
    )

    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: true,
      paths: [PAGE_PATH],
    })
  })

  it('refuses a change that drops a superseded belief', async () => {
    const root = newBrain()
    const contested =
      '\n## Contested\n\n- 2026-08-01: the page held A; it now holds B, because the repository outranks the post.\n'
    write(root, PAGE_PATH, `${PAGE}${contested}`)
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'page')

    // The rewrite reads as an ordinary edit: nothing else here can tell that a
    // belief the wiki once held has stopped existing.
    write(root, PAGE_PATH, `${PAGE}\nIt holds B.\n`)
    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: false,
      failure: {
        code: 'CONTENT_VALIDATION_FAILED',
        reason:
          'projects/toolkit.md: ## Contested lost 1 entry(ies), starting "2026-08-01: the page held A; it now holds B, because the rep"; a superseded belief is kept, never overwritten',
      },
    })
  })

  it('accepts a change that adds one contested entry and keeps the old', async () => {
    const root = newBrain()
    const first =
      '\n## Contested\n\n- 2026-08-01: the page held A; it now holds B, because the repository outranks the post.\n'
    write(root, PAGE_PATH, `${PAGE}${first}`)
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'page')
    write(
      root,
      PAGE_PATH,
      `${PAGE}${first}- 2026-08-03: the page held B; it now holds C, because the owner said so.\n`,
    )
    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: true,
      paths: [PAGE_PATH],
    })
  })
})
