import { describe, expect, it } from 'vitest'
import { clearKeptBranchCommand } from './clear-kept-branch-command.ts'

describe('clearKeptBranchCommand', () => {
  it('removes the worktree before deleting the branch it holds', () => {
    expect(
      clearKeptBranchCommand(
        '/repo/brain',
        'ingest/01M097NSDE2AS0S4N9YY2WXHFP',
        '/tmp/x/01M097NSDE2AS0S4N9YY2WXHFP',
      ),
    ).toBe(
      'git -C /repo/brain worktree remove --force /tmp/x/01M097NSDE2AS0S4N9YY2WXHFP && git -C /repo/brain branch -D ingest/01M097NSDE2AS0S4N9YY2WXHFP && git -C /repo/brain update-ref -d refs/ingest-drafts/01M097NSDE2AS0S4N9YY2WXHFP',
    )
  })

  it('deletes the branch alone when no worktree holds it', () => {
    expect(
      clearKeptBranchCommand(
        '/repo/brain',
        'ingest/01M097NSDE2AS0S4N9YY2WXHFP',
        null,
      ),
    ).toBe(
      'git -C /repo/brain branch -D ingest/01M097NSDE2AS0S4N9YY2WXHFP && git -C /repo/brain update-ref -d refs/ingest-drafts/01M097NSDE2AS0S4N9YY2WXHFP',
    )
  })
})
