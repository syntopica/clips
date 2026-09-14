import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { commitStagedChanges } from '../git/commit-staged-changes.ts'
import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import type { CommitWikiAndLedgerInput } from './commit-wiki-and-ledger-input.ts'
import { stagedPaths } from './staged-paths.ts'

/** One commit for wiki changes plus ledger (SPEC:394-397): a crash between
 * "wiki committed" and "ledger written" would otherwise cause re-synthesis.
 * Stages only the validated paths - never `git add -A` - writes the ledger as
 * a trusted step, re-reads the index, and refuses to commit if anything
 * outside that set reached the index, or if the ledger did not.
 *
 * The test is containment rather than equality, because the two directions are
 * not the same risk. A staged path the validator never saw is the failure this
 * guard exists for. A validated path that staged nothing is a synthesizer that
 * named a page and then left it unchanged - `index.md` is the usual one, named
 * because a page might be created and then not needed - and `git add` on an
 * unmodified file is simply a no-op. Requiring equality turned that into a
 * refusal that threw away a good diff and left the run in a recovery worktree
 * (measured 2026-08-08 on clip 01KZH50AT53SMSB6YKS85ATEP0). The ledger stays
 * mandatory: a commit without it causes re-synthesis, which is the whole reason
 * both go in one commit. The ledger arrives already
 * serialized, because the bytes it must produce answer to the brain's prettier
 * config rather than to anything this step knows. Returns the commit sha. */
export const commitWikiAndLedger = async (
  input: CommitWikiAndLedgerInput,
): Promise<string> => {
  const { worktree, validatedPaths, ledgerPath } = input
  const add = await runGit(worktree, ['add', '--', ...validatedPaths])
  if (add.exitCode !== 0)
    throw new GitFailedError(['add'], add.exitCode, add.stderr)

  const absolute = join(worktree, ledgerPath)
  await mkdir(dirname(absolute), { recursive: true })
  await writeFile(absolute, input.ledgerText)
  const addLedger = await runGit(worktree, ['add', '--', ledgerPath])
  if (addLedger.exitCode !== 0)
    throw new GitFailedError(['add'], addLedger.exitCode, addLedger.stderr)

  const staged = await stagedPaths(worktree)
  const allowed = new Set([...validatedPaths, ledgerPath])
  const unexpected = staged.filter((path) => !allowed.has(path))
  if (unexpected.length > 0) {
    throw new Error(
      `staged paths outside the validated set: ${unexpected.join(', ')}; validated ${[...allowed].sort().join(', ')}`,
    )
  }
  if (!staged.includes(ledgerPath)) {
    throw new Error(
      `the ledger ${ledgerPath} did not reach the index, so this commit would cause re-synthesis`,
    )
  }

  await commitStagedChanges(worktree, input.subject)
  const sha = await runGit(worktree, ['rev-parse', 'HEAD'])
  return sha.stdout.trim()
}
