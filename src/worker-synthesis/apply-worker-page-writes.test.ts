import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { applyWorkerPageWrites } from './apply-worker-page-writes.ts'

const page = (sources: string) =>
  `---\ntitle: X\nsources:\n${sources}---\n\nA claim [S1]. New [SNEW].\n`

describe('applyWorkerPageWrites', () => {
  it('writes a rewritten page with its committed sources back in order', async () => {
    const worktree = temporaryDir('clips-apply-')
    mkdirSync(join(worktree, 'brain', 'topics'), { recursive: true })
    const path = 'brain/topics/x.md'
    writeFileSync(
      join(worktree, path),
      page('  - https://a.example\n  - https://b.example\n'),
    )

    const written = await applyWorkerPageWrites(
      worktree,
      [
        {
          path,
          content: page(
            '  - https://b.example\n  - https://a.example\n  - https://new.example\n',
          ),
        },
      ],
      [path],
      ['brain/topics'],
    )

    expect(written).toEqual([path])
    expect(readFileSync(join(worktree, path), 'utf8')).toBe(
      page(
        '  - https://a.example\n  - https://b.example\n  - https://new.example\n',
      ),
    )
  })
})
