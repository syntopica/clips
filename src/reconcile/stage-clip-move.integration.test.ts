import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { stageClipMove } from './stage-clip-move.ts'

const CLIP = join('2026', '07', 'clip-a')
const PENDING_STATE = '{"status":"pending"}\n'
const MOVED_STATE = '{"status":"needs-claude"}\n'

const store = (): string => {
  const root = temporaryDir('stage-clip-move-')
  execFileSync('git', ['init', '-q', '-b', 'main', root])
  for (const bucket of ['pending', 'needs-claude']) {
    const directory = join(root, 'clips', bucket, CLIP)
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, 'state.json'), PENDING_STATE)
  }
  git(root, 'add', '.')
  git(
    root,
    '-c',
    'user.email=test@example.com',
    '-c',
    'user.name=Test',
    'commit',
    '-qm',
    'init',
  )
  return root
}

describe('stageClipMove', () => {
  it('leaves the state untouched when git refuses the move', async () => {
    const root = store()
    const source = join(root, 'clips', 'pending', CLIP)
    await expect(
      stageClipMove({
        clipsRepository: root,
        clipDirectory: source,
        sourceBucket: 'pending',
        destinationBucket: 'needs-claude',
        state: MOVED_STATE,
      }),
    ).rejects.toThrow()
    expect(readFileSync(join(source, 'state.json'), 'utf8')).toBe(PENDING_STATE)
    expect(git(root, 'status', '--short')).toBe('')
  })
})
