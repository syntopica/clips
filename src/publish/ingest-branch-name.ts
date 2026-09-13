import { ULID_PATTERN } from '../clips/ulid-pattern.ts'

/** Throws on a non-ULID: the branch name reaches `git worktree add` and
 * `git push` argv, so an unvalidated clip id here is a programming error. */
export const ingestBranchName = (clipId: string): string => {
  if (!ULID_PATTERN.test(clipId))
    throw new Error(`ingestBranchName received a non-ULID clip_id: ${clipId}`)
  return `ingest/${clipId}`
}
