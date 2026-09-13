import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { orphanPageFailure } from './orphan-page-failure.ts'

/** The page every case here treats as newly created. */
const NEW_PAGE = 'topics/new.md'

const worktreeWith = async (files: Record<string, string>): Promise<string> => {
  const worktree = await mkdtemp(join(tmpdir(), 'orphan-'))
  for (const [path, text] of Object.entries(files)) {
    await mkdir(join(worktree, path, '..'), { recursive: true })
    await writeFile(join(worktree, path), text)
  }
  return worktree
}

describe('orphanPageFailure', () => {
  it('accepts a new page another page links to', async () => {
    const worktree = await worktreeWith({
      [NEW_PAGE]: '# New\n',
      'projects/brain.md': 'See [[topics/new]] for the detail.\n',
    })

    expect(await orphanPageFailure(worktree, [NEW_PAGE])).toBeNull()
  })

  it('rejects a new page nothing links to', async () => {
    const worktree = await worktreeWith({
      [NEW_PAGE]: '# New\n\nLinks out to [[projects/brain]].\n',
      'projects/brain.md': '# Brain\n',
    })

    expect(await orphanPageFailure(worktree, [NEW_PAGE])).toBe(
      'topics/new.md: no other page links to it - cross-link it from the page it serves, or shelve it',
    )
  })

  it('does not count a link from index.md', async () => {
    const worktree = await worktreeWith({
      [NEW_PAGE]: '# New\n',
      'index.md': '- [[topics/new]] — the new page\n',
    })

    // The root map lists every page by construction, so counting it would make
    // the check pass for everything - the same exclusion the graph makes.
    expect(await orphanPageFailure(worktree, [NEW_PAGE])).toContain(
      'no other page links to it',
    )
  })

  it('does not count a page linking to itself', async () => {
    const worktree = await worktreeWith({
      [NEW_PAGE]: '# New\n\nAs [[topics/new]] says.\n',
    })

    expect(await orphanPageFailure(worktree, [NEW_PAGE])).toContain(
      'no other page links to it',
    )
  })

  it('reads a link the way the graph does, ignoring code spans and aliases', async () => {
    const worktree = await worktreeWith({
      [NEW_PAGE]: '# New\n',
      'topics/quoted.md': 'Write `[[topics/new]]` to link it.\n',
      'projects/brain.md': 'See [[topics/new|the new page]].\n',
    })

    expect(await orphanPageFailure(worktree, [NEW_PAGE])).toBeNull()
  })

  it('checks only the pages this synthesis created', async () => {
    const worktree = await worktreeWith({
      'topics/lonely.md': '# Lonely\n',
      [NEW_PAGE]: '# New\n',
      'projects/brain.md': 'See [[topics/new]].\n',
    })

    // An existing page that lost its last inbound link is a different problem;
    // failing an unrelated clip for it would be an always-fires check.
    expect(await orphanPageFailure(worktree, [NEW_PAGE])).toBeNull()
  })

  it('ignores a created path outside the page directories', async () => {
    const worktree = await worktreeWith({ 'sources/raw.md': '# Raw\n' })

    expect(await orphanPageFailure(worktree, ['sources/raw.md'])).toBeNull()
  })
})
