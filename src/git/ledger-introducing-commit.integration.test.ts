import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { GitFailedError } from './git-failed-error.ts'
import { ledgerIntroducingCommit } from './ledger-introducing-commit.ts'

const repositoryWithoutCommits = (): string => {
  const root = temporaryDir('clips-log-')

  execFileSync('git', ['init', '-q', '-b', 'main', root])
  git(root, 'config', 'user.email', 'test@example.com')
  git(root, 'config', 'user.name', 'Test')
  return root
}

describe('ledgerIntroducingCommit', () => {
  it('throws instead of reporting a repository with no commits as empty', async () => {
    // Verified: `git log --diff-filter=A -1 --format=%H -- <path>` exits 128
    // with empty stdout here. Reading that as null made deriveClipState call a
    // broken brain a successful synthesis.
    await expect(
      ledgerIntroducingCommit(repositoryWithoutCommits(), 'a.md'),
    ).rejects.toBeInstanceOf(GitFailedError)
  })

  it('returns null for a path no commit ever added', async () => {
    const root = repositoryWithoutCommits()
    writeFileSync(join(root, 'a.md'), 'one\n')
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'one')
    expect(await ledgerIntroducingCommit(root, 'never-added.md')).toBeNull()
  })

  it('returns the most recent addition, not the first one', async () => {
    // The behaviour the old comment denied. A ledger is deleted and rewritten
    // on re-ingest, so this path is reachable, which is why plan 2a asks
    // pathExistsInRef instead and plan 2c has to face it.
    const root = repositoryWithoutCommits()
    writeFileSync(join(root, 'a.md'), 'one\n')
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'add')
    git(root, 'rm', '-q', 'a.md')
    git(root, 'commit', '-qm', 'remove')
    writeFileSync(join(root, 'a.md'), 'two\n')
    git(root, 'add', '.')
    git(root, 'commit', '-qm', 'add again')
    expect(await ledgerIntroducingCommit(root, 'a.md')).toBe(
      git(root, 'rev-parse', 'HEAD'),
    )
  })
})
