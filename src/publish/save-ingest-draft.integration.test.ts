import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { recoverIntegratedBranch } from '../commands/recover-integrated-branch.ts'
import { git } from '../testing/git.ts'
import { initGitRepo } from '../testing/init-git-repo.ts'
import { removeIngestWorktree } from './remove-ingest-worktree.ts'
import { saveIngestDraft } from './save-ingest-draft.ts'

const CLIP = '01M097NSDE2AS0S4N9YY2WXHFP'
const DRAFT = `refs/ingest-drafts/${CLIP}`
const roots: string[] = []

const mkdirAndReturn = (path: string): string => {
  mkdirSync(path)
  return path
}

const repositoryWithWorktree = (): { brain: string; worktree: string } => {
  const root = mkdtempSync(join(tmpdir(), 'clips-draft-'))
  roots.push(root)
  const brain = join(root, 'brain')
  mkdirSync(brain)
  initGitRepo(brain)
  writeFileSync(join(brain, 'page.md'), 'base\n')
  git(brain, 'add', '.')
  git(brain, 'commit', '-qm', 'base')
  const worktree = join(root, CLIP)
  git(brain, 'worktree', 'add', '-q', '-b', `ingest/${CLIP}`, worktree)
  return { brain, worktree }
}

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true })
})

describe('saveIngestDraft', () => {
  it('keeps the synthesis under the draft ref without moving the branch', async () => {
    const { brain, worktree } = repositoryWithWorktree()
    const base = git(brain, 'rev-parse', `ingest/${CLIP}`)
    writeFileSync(join(worktree, 'page.md'), 'draft\n')
    writeFileSync(join(worktree, 'new.md'), 'new\n')

    expect(await saveIngestDraft(worktree, CLIP)).toBe(DRAFT)
    expect(git(brain, 'rev-parse', `ingest/${CLIP}`)).toBe(base)
    expect(git(brain, 'show', `${DRAFT}:page.md`)).toBe('draft')
    expect(git(brain, 'show', `${DRAFT}:new.md`)).toBe('new')
    expect(git(worktree, 'diff', '--cached', '--name-only')).toBe('')
  })

  it('refuses an index that already differs from HEAD', async () => {
    const { worktree } = repositoryWithWorktree()
    writeFileSync(join(worktree, 'page.md'), 'staged\n')
    git(worktree, 'add', 'page.md')
    writeFileSync(join(worktree, 'page.md'), 'base\n')

    expect(await saveIngestDraft(worktree, CLIP)).toBeNull()
    expect(git(worktree, 'show', ':page.md')).toBe('staged')
  })

  it('refuses an untracked embedded repository and restores the index', async () => {
    const { worktree } = repositoryWithWorktree()
    const nested = join(worktree, 'nested')
    mkdirSync(nested)
    initGitRepo(nested)
    writeFileSync(join(nested, 'data.md'), 'nested\n')
    git(nested, 'add', '.')
    git(nested, 'commit', '-qm', 'nested')

    expect(await saveIngestDraft(worktree, CLIP)).toBeNull()
    expect(git(worktree, 'diff', '--cached', '--name-only')).toBe('')
  })

  it('refuses a worktree holding ignored files', async () => {
    const { worktree } = repositoryWithWorktree()
    writeFileSync(join(worktree, '.gitignore'), 'notes.txt\n')
    writeFileSync(join(worktree, 'notes.txt'), 'local\n')

    expect(await saveIngestDraft(worktree, CLIP)).toBeNull()
  })

  it('refuses a worktree with an assume-unchanged edit', async () => {
    const { worktree } = repositoryWithWorktree()
    git(worktree, 'update-index', '--assume-unchanged', 'page.md')
    writeFileSync(join(worktree, 'page.md'), 'hidden\n')
    writeFileSync(join(worktree, 'new.md'), 'new\n')

    expect(await saveIngestDraft(worktree, CLIP)).toBeNull()
  })

  it('refuses without throwing when add -A cannot stage the tree', async () => {
    const { worktree } = repositoryWithWorktree()
    initGitRepo(mkdirAndReturn(join(worktree, 'empty-repo')))
    writeFileSync(join(worktree, 'new.md'), 'new\n')

    expect(await saveIngestDraft(worktree, CLIP)).toBeNull()
    expect(git(worktree, 'diff', '--cached', '--name-only')).toBe('')
  })

  it('refuses a worktree whose index tracks a submodule', async () => {
    const { worktree } = repositoryWithWorktree()
    const nested = join(worktree, 'nested')
    mkdirSync(nested)
    initGitRepo(nested)
    writeFileSync(join(nested, 'data.md'), 'nested\n')
    git(nested, 'add', '.')
    git(nested, 'commit', '-qm', 'nested')
    git(worktree, 'add', 'nested')
    git(worktree, 'commit', '-qm', 'track nested')
    writeFileSync(join(nested, 'data.md'), 'unsaved\n')

    expect(await saveIngestDraft(worktree, CLIP)).toBeNull()
  })
})

describe('removeIngestWorktree with a draft', () => {
  it('removes the checkout and keeps the branch and the draft', async () => {
    const { brain, worktree } = repositoryWithWorktree()
    writeFileSync(join(worktree, 'page.md'), 'draft\n')

    expect(await removeIngestWorktree(brain, CLIP, worktree)).toBe(
      `branch ingest/${CLIP}, draft ${DRAFT}`,
    )
    expect(git(brain, 'worktree', 'list')).not.toContain(CLIP)
    expect(git(brain, 'branch', '--list', `ingest/${CLIP}`)).not.toBe('')
  })

  it('is finished by recovery when the checkout survived a saved draft', async () => {
    const { brain, worktree } = repositoryWithWorktree()
    writeFileSync(join(worktree, 'page.md'), 'draft\n')
    await saveIngestDraft(worktree, CLIP)

    expect(
      await recoverIntegratedBranch(brain, `ingest/${CLIP}`, CLIP),
    ).toContain(`draft ${DRAFT}`)
    expect(git(brain, 'worktree', 'list')).not.toContain(CLIP)
    expect(await recoverIntegratedBranch(brain, `ingest/${CLIP}`, CLIP)).toBe(
      `ingest/${CLIP}: kept with ${DRAFT} for an operator`,
    )
  })

  it('keeps the branch marker when a saved checkout is clean again', async () => {
    const { brain, worktree } = repositoryWithWorktree()
    writeFileSync(join(worktree, 'page.md'), 'draft\n')
    await saveIngestDraft(worktree, CLIP)
    writeFileSync(join(worktree, 'page.md'), 'base\n')

    expect(await removeIngestWorktree(brain, CLIP, worktree)).toBe(
      `branch ingest/${CLIP}`,
    )
    expect(git(brain, 'branch', '--list', `ingest/${CLIP}`)).not.toBe('')
  })
})
