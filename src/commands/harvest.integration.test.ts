import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { harvest } from './harvest.ts'

const DATE = '2026-07-30'

/** A brain whose inbox holds one dated triage run with a single ticked entry,
 * which is what `--promote` reads before it touches the clip store. */
const newBrain = (): string => {
  const brain = temporaryDir('harvest-brain-')
  const directory = join(brain, 'inbox', 'newsletter-triage', DATE)
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    join(directory, 'testing.md'),
    '## Review\n\n- [x] [Selection - Web APIs](https://example.com/a) - reason\n',
  )
  return brain
}

const newStore = (): string => {
  const store = temporaryDir('harvest-store-')
  mkdirSync(join(store, 'clips', 'pending'), { recursive: true })
  return store
}

const runPromote = async (
  brain: string,
  store: string,
): Promise<{ exitCode: number; stderr: string }> => {
  const written: string[] = []
  const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(((
    chunk: string,
  ): boolean => {
    written.push(chunk)
    return true
  }) as typeof process.stderr.write)
  const stdoutSpy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation(() => true)
  try {
    const exitCode = await harvest(brain, store, {
      source: null,
      dryRun: false,
      promote: true,
      captureAll: false,
      date: DATE,
      since: null,
    })
    return { exitCode, stderr: written.join('') }
  } finally {
    stderrSpy.mockRestore()
    stdoutSpy.mockRestore()
  }
}

describe('clips harvest --promote, a clip store it cannot read', () => {
  it('reports the error on one line instead of throwing out of the command', async () => {
    const brain = newBrain()
    const store = newStore()
    chmodSync(join(store, 'clips'), 0o000)
    try {
      const { exitCode, stderr } = await runPromote(brain, store)
      expect(exitCode).toBe(EXIT_CODE.fatalLocal)
      expect(stderr).toContain('EACCES')
      expect(stderr.trimEnd()).not.toContain('\n')
    } finally {
      chmodSync(join(store, 'clips'), 0o700)
    }
  })
})
