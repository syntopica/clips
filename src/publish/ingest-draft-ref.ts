import { ULID_PATTERN } from '../clips/ulid-pattern.ts'

/** Where a refused or abandoned synthesis is kept once its worktree is gone.
 * Outside `refs/heads/`, so `listBranches(..., 'ingest/')` never sees it and
 * recovery can never push it to main. Throws on a non-ULID for the same reason
 * as ingestBranchName: the name reaches git argv. */
export const ingestDraftRef = (clipId: string): string => {
  if (!ULID_PATTERN.test(clipId))
    throw new Error(`ingestDraftRef received a non-ULID clip_id: ${clipId}`)
  return `refs/ingest-drafts/${clipId}`
}
