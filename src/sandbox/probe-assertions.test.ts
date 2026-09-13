import { describe, expect, it } from 'vitest'
import { PROBE_ASSERTIONS } from './probe-assertions.ts'

const PATHS = {
  worktree: '/tmp/wt',
  clipInput: '/tmp/clip',
  canaryFile: '/tmp/outside/canary.txt',
  homeDirectory: '/Users/someone',
  codexHome: '/tmp/codex-home',
  outsideWritePath: '/tmp/outside/written',
}

describe('PROBE_ASSERTIONS', () => {
  it('covers every row the spec requires', () => {
    expect(PROBE_ASSERTIONS.map((row) => row.id)).toEqual([
      'shell-starts',
      'worktree-read',
      'worktree-write',
      'clip-read',
      'outside-read-denied',
      'ssh-read-denied',
      'codex-home-read-denied',
      'outside-write-denied',
      'network-denied',
    ])
  })

  it('expects the positive rows to succeed and the isolation rows to be denied', () => {
    const expectations = Object.fromEntries(
      PROBE_ASSERTIONS.map((row) => [row.id, row.expected]),
    )
    expect(expectations['shell-starts']).toBe('succeeded')
    expect(expectations['worktree-write']).toBe('succeeded')
    expect(expectations['clip-read']).toBe('succeeded')
    expect(expectations['outside-read-denied']).toBe('denied')
    expect(expectations['ssh-read-denied']).toBe('denied')
    expect(expectations['network-denied']).toBe('denied')
  })

  it('builds concrete argv from the supplied paths', () => {
    const clipRead = PROBE_ASSERTIONS.find((row) => row.id === 'clip-read')
    expect(clipRead?.command(PATHS)).toEqual(['/bin/cat', '/tmp/clip/index.md'])
  })

  it('never references the home directory except in the denial rows', () => {
    const succeeding = PROBE_ASSERTIONS.filter(
      (row) => row.expected === 'succeeded',
    )
    for (const row of succeeding)
      expect(row.command(PATHS).join(' ')).not.toContain(PATHS.homeDirectory)
  })
})
