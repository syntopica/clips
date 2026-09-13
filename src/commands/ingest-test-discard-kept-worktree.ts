import { rmSync } from 'node:fs'
import { git } from '../testing/git.ts'
import { CLIP_ID } from './ingest-test-clip-id.ts'

/** What an operator does with the worktree a skipped run kept, so the clip can
 * be offered again. */
export const discardKeptWorktree = (brain: string): void => {
  const kept = git(brain, 'worktree', 'list', '--porcelain')
    .split('\n')
    .find(
      (line) => line.startsWith('worktree ') && line.includes('brain-ingest-'),
    )
  if (kept !== undefined)
    rmSync(kept.slice('worktree '.length), { recursive: true, force: true })
  git(brain, 'worktree', 'prune')
  git(brain, 'branch', '-D', `ingest/${CLIP_ID}`)
}
