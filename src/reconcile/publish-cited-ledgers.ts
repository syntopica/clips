import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'

/** One commit on the brain's own `main` carrying nothing but ledger files, then
 * a push. Unlike the ingest pipeline this does not go through a worktree: no
 * wiki page changes, so there is nothing to validate and nothing to review,
 * and the commit stages exactly the ledger paths - another session's dirty
 * file in the tree is never swept in. A rejected push is retried through
 * `pull --rebase --autostash` (the ledgers are new files, so the rebase cannot
 * conflict; autostash keeps another session's uncommitted work out of the
 * way), at most twice. Returns the sha origin/main carries. */
export const publishCitedLedgers = async (
  brainRepository: string,
  ledgers: readonly { path: string; text: string }[],
  subject: string,
): Promise<string> => {
  for (const ledger of ledgers) {
    const absolute = join(brainRepository, ledger.path)
    await mkdir(dirname(absolute), { recursive: true })
    await writeFile(absolute, ledger.text)
  }
  const paths = ledgers.map((ledger) => ledger.path)
  const add = await runGit(brainRepository, ['add', '--', ...paths])
  if (add.exitCode !== 0)
    throw new GitFailedError(['add'], add.exitCode, add.stderr)
  const commit = await runGit(brainRepository, ['commit', '-q', '-m', subject])
  if (commit.exitCode !== 0)
    throw new GitFailedError(['commit'], commit.exitCode, commit.stderr)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const push = await runGit(brainRepository, ['push', 'origin', 'main'])
    if (push.exitCode === 0) {
      const sha = await runGit(brainRepository, ['rev-parse', 'HEAD'])
      return sha.stdout.trim()
    }
    const rebase = await runGit(brainRepository, [
      '-c',
      'rebase.autoStash=true',
      'pull',
      '--rebase',
      'origin',
      'main',
    ])
    if (rebase.exitCode !== 0)
      throw new GitFailedError(['pull'], rebase.exitCode, rebase.stderr)
  }
  throw new Error(
    'origin/main kept advancing; the ledger commit is local and safe, push it by hand',
  )
}
