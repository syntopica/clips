import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { removedSectionsRefusal } from '../validation/removed-sections-refusal.ts'
import { discardWorktreeChanges } from './discard-worktree-changes.ts'

const PAGE = '# Topic\n\n## Kept\n\nOne.\n\n## Dropped\n\nTwo.\n'

const repository = (): string => {
  const root = temporaryDir('discard-worktree-')
  execFileSync('git', ['init', '-q', '-b', 'main', root])
  writeFileSync(join(root, 'topic.md'), PAGE)
  git(root, 'add', '.')
  git(
    root,
    '-c',
    'user.email=test@example.com',
    '-c',
    'user.name=Test',
    'commit',
    '-qm',
    'init',
  )
  return root
}

describe('a draft that dropped a section', () => {
  it('is named, then discarded back to the base commit', async () => {
    const root = repository()
    writeFileSync(join(root, 'topic.md'), '# Topic\n\n## Kept\n\nOne more.\n')
    writeFileSync(join(root, 'new.md'), '# New\n')

    expect(await removedSectionsRefusal(root)).toMatch(
      /^topic\.md: it removes 1 section\(s\) the page already had: Dropped/u,
    )
    await discardWorktreeChanges(root)
    expect(readFileSync(join(root, 'topic.md'), 'utf8')).toBe(PAGE)
    expect(existsSync(join(root, 'new.md'))).toBe(false)
    expect(await removedSectionsRefusal(root)).toBeNull()
  })
})
