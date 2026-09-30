import { describe, expect, it } from 'vitest'
import { withSyntopicaConfig } from '../config/with-syntopica-config.ts'
import { pageAtimes } from '../reads/page-atimes.ts'
import { git } from '../testing/git.ts'
import { nestedWikiConfig } from '../testing/nested-wiki-config.ts'
import { PAGE } from './validate-worktree-fixture-page.ts'
import { write } from './validate-worktree-fixture-write.ts'
import { validateWorktree } from './validate-worktree.ts'

/** The failure this suite pins: from 2026-09-14 the owner's pages lived under
 * `brain/`, and every synthesis was refused as `outside the allowed directories
 * (brain)` because the allowlist was five names at the repository root. */
const nestedBrain = (): { data: string; run: <T>(body: () => T) => T } => {
  const { data, config } = nestedWikiConfig()
  write(data, 'brain/index.md', '# Brain - index\n\n## Notes\n')
  // The hub links by page id, relative to brain/, as every real page does.
  write(data, 'brain/notes/hub.md', '# Hub\n\nSee [[notes/toolkit]].\n')
  git(data, 'add', '.')
  git(data, 'commit', '-qm', 'init')
  return { data, run: (body) => withSyntopicaConfig(config, body) }
}

describe('validateWorktree with the wiki under brain/', () => {
  it('accepts a linked page in a configured directory', async () => {
    const { data, run } = nestedBrain()
    write(data, 'brain/notes/toolkit.md', PAGE)
    expect(await run(async () => validateWorktree(data, data))).toEqual({
      ok: true,
      paths: ['brain/notes/toolkit.md'],
    })
  })

  it('refuses the same page written at the repository root', async () => {
    const { data, run } = nestedBrain()
    write(data, 'notes/toolkit.md', PAGE)
    const result = await run(async () => validateWorktree(data, data))
    expect(result.ok).toBe(false)
    expect(JSON.stringify(result)).toContain(
      'notes/toolkit.md: outside the allowed directories (notes)',
    )
  })

  it('refuses a new page nothing links to by its page id', async () => {
    const { data, run } = nestedBrain()
    write(data, 'brain/notes/lonely.md', PAGE)
    const result = await run(async () => validateWorktree(data, data))
    expect(JSON.stringify(result)).toContain(
      'brain/notes/lonely.md: no other page links to it',
    )
  })

  it('keys observed reads by page path, the spelling ledgers record', async () => {
    const { data, run } = nestedBrain()
    const atimes = await run(async () => pageAtimes(data))
    expect([...atimes.keys()].sort()).toEqual(['index.md', 'notes/hub.md'])
  })
})
