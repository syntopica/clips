import { removeIngestWorktree } from '../publish/remove-ingest-worktree.ts'

/** Cleanup that narrates itself (SPEC:435-436): the unforced removal deletes
 * only clean, integrated work, and whatever git refuses to delete is reported
 * as deliberately kept for recovery. */
export const reportKeptArtifacts = async (
  brainRepository: string,
  clipId: string,
  worktree: string,
): Promise<void> => {
  const kept = await removeIngestWorktree(brainRepository, clipId, worktree)
  if (kept !== null) process.stdout.write(`kept for recovery: ${kept}\n`)
}
