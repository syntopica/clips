import { describe, expect, it } from 'vitest'
import { newBrain } from './validate-worktree-fixture-new-brain.ts'
import { PAGE } from './validate-worktree-fixture-page.ts'
import { write } from './validate-worktree-fixture-write.ts'
import { validateWorktree } from './validate-worktree.ts'

describe('validateWorktree: refuses bare-directory and malformed-frontmatter pages', () => {
  it('refuses a synthesis that edits index.md, which is derived now', async () => {
    const root = newBrain()
    write(root, 'projects/pyfirma.md', PAGE)
    write(
      root,
      'index.md',
      '# Brain - index\n\n## Projects\n\n- [[projects/pyfirma]]\n',
    )
    expect(await validateWorktree(root, root)).toEqual({
      ok: false,
      failure: {
        code: 'CONTENT_VALIDATION_FAILED',
        reason: 'index.md: a bare directory, not a page',
      },
    })
  })

  it('refuses a page whose frontmatter has no summary to index it by', async () => {
    const root = newBrain()
    write(root, 'projects/pyfirma.md', PAGE.replace(/^summary:.*\n/m, ''))
    expect(await validateWorktree(root, root)).toEqual({
      ok: false,
      failure: {
        code: 'CONTENT_VALIDATION_FAILED',
        reason: 'projects/pyfirma.md: frontmatter is missing summary',
      },
    })
  })

  it('still refuses every other root file', async () => {
    const root = newBrain()
    write(root, 'README.md', '# readme\n\nchanged\n')
    expect(await validateWorktree(root, root)).toEqual({
      ok: false,
      failure: {
        code: 'CONTENT_VALIDATION_FAILED',
        reason: 'README.md: a bare directory, not a page',
      },
    })
  })
})
