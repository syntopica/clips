import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { BRAIN } from './validate-worktree-fixture-brain-root.ts'
import { newBrain } from './validate-worktree-fixture-new-brain.ts'
import { PAGE_PATH } from './validate-worktree-fixture-page-path.ts'
import { PAGE } from './validate-worktree-fixture-page.ts'
import { write } from './validate-worktree-fixture-write.ts'
import { validateWorktree } from './validate-worktree.ts'

/** The first sources: entry, as a list line. */
const SOURCE_A_LINE = '  - https://example.invalid/a\n'

describe('validateWorktree: claim marker and sources: list integrity', () => {
  it('refuses a marker naming a source the page does not have', async () => {
    const root = newBrain()
    write(root, PAGE_PATH, `${PAGE}\nA claim [S2].\n`)
    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: false,
      failure: {
        code: 'CONTENT_VALIDATION_FAILED',
        reason:
          "projects/pyfirma.md: S2 names no entry in this page's sources: list",
      },
    })
  })

  it('accepts markers that resolve, and OWN on any page', async () => {
    const root = newBrain()
    write(root, PAGE_PATH, `${PAGE}\nOne [S1]. Mine [OWN].\n`)
    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: true,
      paths: [PAGE_PATH],
    })
  })

  it('refuses a reordered sources: list on a page carrying markers', async () => {
    const root = newBrain()
    const twoSources = PAGE.replace(
      SOURCE_A_LINE,
      '  - https://example.invalid/a\n  - https://example.invalid/b\n',
    )
    write(root, PAGE_PATH, `${twoSources}\nA claim [S1].\n`)
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'page')
    const swapped = PAGE.replace(
      SOURCE_A_LINE,
      '  - https://example.invalid/b\n  - https://example.invalid/a\n',
    )

    // The marker still resolves, so nothing else here would notice: swapping
    // the two entries reattributes the claim without touching a word of it.
    write(root, PAGE_PATH, `${swapped}\nA claim [S1].\n`)
    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: false,
      failure: {
        code: 'CONTENT_VALIDATION_FAILED',
        reason:
          'projects/pyfirma.md: sources: was reordered or shortened; on a page carrying claim markers it is append-only, because every marker points at a position',
      },
    })
  })

  it('accepts an appended source on a page carrying markers', async () => {
    const root = newBrain()
    write(root, PAGE_PATH, `${PAGE}\nA claim [S1].\n`)
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'page')
    const appended = PAGE.replace(
      SOURCE_A_LINE,
      '  - https://example.invalid/a\n  - https://example.invalid/b\n',
    )
    write(root, PAGE_PATH, `${appended}\nA claim [S1]. Another [S2].\n`)
    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: true,
      paths: [PAGE_PATH],
    })
  })

  it('lets a page with no markers reorder its sources freely', async () => {
    const root = newBrain()
    const twoSources = PAGE.replace(
      SOURCE_A_LINE,
      '  - https://example.invalid/a\n  - https://example.invalid/b\n',
    )
    write(root, PAGE_PATH, twoSources)
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'page')
    const swapped = PAGE.replace(
      SOURCE_A_LINE,
      '  - https://example.invalid/b\n  - https://example.invalid/a\n',
    )

    // Every page in the wiki today is this one: no positions to protect.
    write(root, PAGE_PATH, `${swapped}\nsynthesized.\n`)
    expect(await validateWorktree(BRAIN, root)).toEqual({
      ok: true,
      paths: [PAGE_PATH],
    })
  })
})
