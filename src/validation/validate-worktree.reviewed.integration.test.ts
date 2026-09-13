import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { newBrain } from './validate-worktree-fixture-new-brain.ts'
import { PAGE_PATH } from './validate-worktree-fixture-page-path.ts'
import { PAGE } from './validate-worktree-fixture-page.ts'
import { REVIEWED_PAGE } from './validate-worktree-fixture-reviewed-page.ts'
import { write } from './validate-worktree-fixture-write.ts'
import { validateWorktree } from './validate-worktree.ts'

describe('validateWorktree: reviewed marker protection', () => {
  it('refuses to edit a page marked reviewed: true', async () => {
    const root = newBrain()
    write(root, PAGE_PATH, REVIEWED_PAGE)
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'curate')
    write(root, PAGE_PATH, `${REVIEWED_PAGE}\nsynthesized.\n`)
    expect(await validateWorktree(root, root)).toEqual({
      ok: false,
      failure: {
        code: 'CONTENT_VALIDATION_FAILED',
        reason:
          'projects/pyfirma.md: marked reviewed: true, so the pipeline may not edit it',
      },
    })
  })

  it('judges the marker on the committed page, not the rewritten one', async () => {
    const root = newBrain()
    write(root, PAGE_PATH, REVIEWED_PAGE)
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'curate')
    write(root, PAGE_PATH, PAGE)
    expect(await validateWorktree(root, root)).toEqual({
      ok: false,
      failure: {
        code: 'CONTENT_VALIDATION_FAILED',
        reason:
          'projects/pyfirma.md: marked reviewed: true, so the pipeline may not edit it',
      },
    })
  })
})
