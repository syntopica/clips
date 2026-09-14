import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runGit } from '../git/run-git.ts'
import { git } from '../testing/git.ts'
import { installCommitMessageHook } from '../testing/install-commit-message-hook.ts'
import { commitWikiAndLedger } from './commit-wiki-and-ledger.ts'

const LEDGER = '.ingest/clips/01ARZ3NDEKTSV4RRFFQ69G5FAV.json'

const repository = async (): Promise<string> => {
  const worktree = mkdtempSync(join(tmpdir(), 'commit-wiki-'))
  await runGit(worktree, ['init', '-q', '-b', 'main'])
  await runGit(worktree, ['config', 'user.email', 'test@example.com'])
  await runGit(worktree, ['config', 'user.name', 'Test'])
  mkdirSync(join(worktree, 'topics'), { recursive: true })
  writeFileSync(join(worktree, 'topics', 'a.md'), 'original\n')
  writeFileSync(join(worktree, 'index.md'), 'index\n')
  await runGit(worktree, ['add', '-A'])
  await runGit(worktree, ['commit', '-q', '-m', 'base'])
  return worktree
}

describe('commitWikiAndLedger', () => {
  const subject = 'docs(brain): ingest one clip'
  const page = 'topics/a.md'
  it('commits when a validated page was left unchanged', async () => {
    // The synthesizer names index.md and then does not need it. `git add` on an
    // unmodified file is a no-op, so the staged set is a strict subset of the
    // validated one - which used to be refused, throwing away a good diff.
    const worktree = await repository()
    writeFileSync(join(worktree, 'topics', 'a.md'), 'original\nnew section\n')

    const sha = await commitWikiAndLedger({
      worktree,
      validatedPaths: ['index.md', page],
      ledgerPath: LEDGER,
      ledgerText: '{}\n',
      subject,
    })

    expect(sha).toMatch(/^[\da-f]{40}$/)
  })

  it('refuses a path the validator never saw', async () => {
    const worktree = await repository()
    writeFileSync(join(worktree, 'topics', 'a.md'), 'original\nnew\n')
    writeFileSync(join(worktree, 'secrets.md'), 'not validated\n')
    await runGit(worktree, ['add', '--', 'secrets.md'])

    await expect(
      commitWikiAndLedger({
        worktree,
        validatedPaths: [page],
        ledgerPath: LEDGER,
        ledgerText: '{}\n',
        subject,
      }),
    ).rejects.toThrow(/staged paths outside the validated set: secrets\.md/)
  })
  it('retains the staged wiki and ledger and reports a commit-hook refusal', async () => {
    const worktree = await repository()
    const before = git(worktree, 'rev-parse', 'HEAD')
    installCommitMessageHook(worktree, true)
    writeFileSync(join(worktree, 'topics', 'a.md'), 'new section\n')
    const failure = await commitWikiAndLedger({
      worktree,
      validatedPaths: [page],
      ledgerPath: LEDGER,
      ledgerText: '{}\n',
      subject,
    }).catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(Error)
    expect((failure as Error).message).toContain(subject)
    expect((failure as Error).message).toContain('[type-empty]')
    expect((failure as Error).message).toContain('staged but uncommitted')
    expect(git(worktree, 'rev-parse', 'HEAD')).toBe(before)
    expect(
      git(worktree, 'diff', '--cached', '--name-only').split('\n'),
    ).toEqual([LEDGER, page])
  })
})
