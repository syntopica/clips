import { describe, expect, it } from 'vitest'
import { clearKeptBranchCommand } from './clear-kept-branch-command.ts'

describe('clearKeptBranchCommand', () => {
  it('removes the worktree before deleting the branch it holds', () => {
    expect(
      clearKeptBranchCommand('/repo/brain', 'ingest/01ABC', '/tmp/x/01ABC'),
    ).toBe(
      'git -C /repo/brain worktree remove --force /tmp/x/01ABC && git -C /repo/brain branch -D ingest/01ABC',
    )
  })

  it('deletes the branch alone when no worktree holds it', () => {
    expect(clearKeptBranchCommand('/repo/brain', 'ingest/01ABC', null)).toBe(
      'git -C /repo/brain branch -D ingest/01ABC',
    )
  })
})
