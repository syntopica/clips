import { existsSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { captureStderr } from '../testing/capture-stderr.ts'
import { git } from '../testing/git.ts'
import { initGitRepo } from '../testing/init-git-repo.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import type { ClipRun } from './clip-run.ts'
import { clipRunsDirectory } from './clip-runs-directory.ts'
import { MAX_CLIP_RUNS } from './max-clip-runs.ts'
import { readClipRuns } from './read-clip-runs.ts'
import { recordClipRun } from './record-clip-run.ts'

const CLIP_ID = '01KYFX6NFRDVW03ZFJXQ6W1VVG'

const run = (durationMs: number): ClipRun => ({
  startedAt: '2026-10-04T10:00:00.000Z',
  durationMs,
  outcome: 'escalated',
  model: 'worker:ollama/m',
  boundary: 'worker-inference',
  workerJobIds: ['job-1'],
  usage: null,
})

describe('recordClipRun', () => {
  it('keeps the history in the git directory, never in the working tree', async () => {
    const brain = temporaryDir('clip-runs-brain-')
    initGitRepo(brain)
    await recordClipRun(brain, CLIP_ID, run(5))
    await recordClipRun(brain, CLIP_ID, run(6))

    const directory = await clipRunsDirectory(brain)
    expect(directory).toBe(join(brain, '.git', 'clips-runs'))
    expect(
      (await readClipRuns(directory ?? '', CLIP_ID)).map((r) => r.durationMs),
    ).toEqual([5, 6])
    expect(git(brain, 'status', '--porcelain')).toBe('')
  })

  it('reads the main checkout history from a linked worktree', async () => {
    const brain = temporaryDir('clip-runs-main-')
    initGitRepo(brain)
    git(brain, 'commit', '-q', '--allow-empty', '-m', 'init')
    const worktree = join(temporaryDir('clip-runs-wt-'), 'wt')
    git(brain, 'worktree', 'add', '-q', worktree)
    await recordClipRun(worktree, CLIP_ID, run(1))
    expect(realpathSync((await clipRunsDirectory(worktree)) ?? '')).toBe(
      realpathSync((await clipRunsDirectory(brain)) ?? ''),
    )
  })

  it('keeps only the most recent runs', async () => {
    const brain = temporaryDir('clip-runs-cap-')
    initGitRepo(brain)
    for (let index = 0; index < MAX_CLIP_RUNS + 3; index += 1)
      await recordClipRun(brain, CLIP_ID, run(index))
    const runs = await readClipRuns(
      (await clipRunsDirectory(brain)) ?? '',
      CLIP_ID,
    )
    expect(runs).toHaveLength(MAX_CLIP_RUNS)
    expect(runs[0]?.durationMs).toBe(3)
  })

  it('records nothing and does not throw outside a repository', async () => {
    const plain = temporaryDir('clip-runs-plain-')
    const { stderr } = await captureStderr(async () => {
      await recordClipRun(plain, CLIP_ID, run(1))
      return 0
    })
    expect(stderr).toBe('')
    expect(existsSync(join(plain, 'clips-runs'))).toBe(false)
  })
})
