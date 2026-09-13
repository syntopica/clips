import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { captureStderr } from '../testing/capture-stderr.ts'
import { clipTestMetadata } from '../testing/clip-test-metadata.ts'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { status } from './status.ts'

/** A brain with a real bare origin, so origin/main is a genuine tracking ref. */
const newBrain = (): string => {
  const origin = temporaryDir('status-origin-')
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin])
  const brain = temporaryDir('status-brain-')
  execFileSync('git', ['init', '-q', '-b', 'main', brain])
  git(brain, 'config', 'user.email', 'test@example.com')
  git(brain, 'config', 'user.name', 'Test')
  writeFileSync(join(brain, 'index.md'), '# brain\n')
  git(brain, 'add', '.')
  git(brain, 'commit', '-qm', 'init')
  git(brain, 'remote', 'add', 'origin', origin)
  git(brain, 'push', '-q', '-u', 'origin', 'main')
  return brain
}

const metadata = (clipId: string): Record<string, unknown> => ({
  ...clipTestMetadata,
  clip_id: clipId,
  title: 'Selection - Web APIs | MDN',
})

const writeClip = (
  store: string,
  bucket: string,
  name: string,
  files: Record<string, string>,
): void => {
  const directory = join(store, 'clips', bucket, '2026', '07', name)
  mkdirSync(directory, { recursive: true })
  for (const [file, body] of Object.entries(files))
    writeFileSync(join(directory, file), body)
}

/** One healthy pending clip and one thin mobile clip: the real store in
 * miniature. */
const newStore = (): string => {
  const store = temporaryDir('status-store-')
  writeClip(store, 'pending', '2026-07-26-example-com-t-01kyfx6n', {
    'metadata.json': JSON.stringify(metadata('01KYFX6NFRDVW03ZFJXQ6W1VVG')),
    'state.json': JSON.stringify({
      status: 'pending',
      updatedAt: '2026-07-26T19:07:35Z',
      failure: null,
      brainCommit: null,
    }),
    'index.md': '# t\n',
  })
  writeClip(store, 'pending', '2026-07-28-042951-mobile', {
    'index.md': '---\nschema_version: 2\n---\n',
  })
  return store
}

const runStatus = async (
  brain: string,
  store: string,
): Promise<{ exitCode: number; stdout: string }> => {
  const written: string[] = []
  const spy = vi.spyOn(process.stdout, 'write').mockImplementation(((
    chunk: string,
  ): boolean => {
    written.push(chunk)
    return true
  }) as typeof process.stdout.write)
  try {
    return { exitCode: await status(brain, store), stdout: written.join('') }
  } finally {
    spy.mockRestore()
  }
}

const runStatusStderr = async (
  brain: string,
  store: string,
): Promise<{ exitCode: number; stderr: string }> => {
  return captureStderr(async () => status(brain, store))
}

describe('clips status, a clips repository that was never pulled', () => {
  it('reports the missing repository instead of a healthy zero-clip status', async () => {
    const brain = newBrain()
    const missing = join(temporaryDir('status-missing-'), 'never-pulled')
    const { exitCode, stderr } = await runStatusStderr(brain, missing)
    expect(exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(stderr).toContain(missing)
    expect(stderr).toContain('clips pull')
  })
})

describe('clips status, a clips repository it cannot read', () => {
  it('reports the error on one line instead of throwing out of the command', async () => {
    const brain = newBrain()
    const store = newStore()
    chmodSync(join(store, 'clips'), 0o000)
    try {
      const { exitCode, stderr } = await runStatusStderr(brain, store)
      expect(exitCode).toBe(EXIT_CODE.fatalLocal)
      expect(stderr).toContain('EACCES')
      expect(stderr.trimEnd()).not.toContain('\n')
    } finally {
      chmodSync(join(store, 'clips'), 0o700)
    }
  })
})

describe('clips status, end to end', () => {
  it('reports every clip with its state and evidence', async () => {
    const { exitCode, stdout } = await runStatus(newBrain(), newStore())
    expect(stdout).toContain('pending')
    expect(stdout).toContain('01KYFX6N example.com Selection - Web APIs | MDN')
    expect(stdout).toContain('no ledger')
    expect(stdout).toContain('unreadable')
    expect(stdout).toContain('2026-07-28-042951-mobile')
    expect(stdout).toContain('no metadata.json')
    expect(stdout).toContain('2 clips, 0 inconsistent, 1 unreadable')
    // Decision 4: a thin clip is a known gap, not a failure. Exiting 2 here
    // would make the command unusable under `set -e` until plan 2d lands.
    expect(exitCode).toBe(EXIT_CODE.success)
  })

  it('exits 2 when a clip is inconsistent, and only then', async () => {
    const store = newStore()
    writeClip(store, 'pending', '2026-07-27-example-com-u-01kyggcn', {
      'metadata.json': JSON.stringify(metadata('01KYGGCNH0HN292WZ1VQGVR2XW')),
      'state.json': JSON.stringify({
        status: 'processed',
        updatedAt: '2026-07-27T19:07:35Z',
        failure: null,
        brainCommit: 'deadbee',
      }),
      'index.md': '# u\n',
    })
    const { exitCode, stdout } = await runStatus(newBrain(), store)
    expect(stdout).toContain('inconsistent')
    expect(stdout).toContain('3 clips, 1 inconsistent, 1 unreadable')
    expect(exitCode).toBe(EXIT_CODE.clipsStopped)
  })
})
