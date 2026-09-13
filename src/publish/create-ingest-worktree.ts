import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { GitFailedError } from '../git/git-failed-error.ts'
import { runGit } from '../git/run-git.ts'
import { ingestBranchName } from './ingest-branch-name.ts'

/** A worktree on branch ingest/<clip_id>, created from an explicit sha
 * (SPEC:333-334) - never from a symbolic ref, so the base recorded in the
 * ledger is exactly what the worktree was cut from. The directory lives under
 * the system temp dir, outside both repositories, so an abandoned one can
 * never dirty a preflight. */
export const createIngestWorktree = async (
  brainRepository: string,
  clipId: string,
  baseSha: string,
): Promise<string> => {
  const branch = ingestBranchName(clipId)
  const directory = join(await mkdtemp(join(tmpdir(), 'brain-ingest-')), clipId)
  const args = ['worktree', 'add', '-b', branch, directory, baseSha]
  const result = await runGit(brainRepository, args)
  if (result.exitCode !== 0)
    throw new GitFailedError(args, result.exitCode, result.stderr)
  return directory
}
