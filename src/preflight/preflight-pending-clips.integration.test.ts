import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { preflightPendingClips } from './preflight-pending-clips.ts'

const repository = mkdtempSync(join(tmpdir(), 'clips-pending-preflight-'))
const git = (...args: string[]): void => {
  execFileSync('git', ['-C', repository, ...args], { stdio: 'ignore' })
}

beforeAll(() => {
  git('init', '--initial-branch=main')
  git('config', 'user.email', 'test@example.invalid')
  git('config', 'user.name', 'Test')
  mkdirSync(join(repository, 'clips', 'pending'), { recursive: true })
  writeFileSync(join(repository, 'clips', 'pending', 'tracked.md'), 'tracked\n')
  git('add', '.')
  git('commit', '-m', 'seed')
})
afterAll(() => {
  rmSync(repository, { recursive: true, force: true })
})

describe('preflightPendingClips', () => {
  it('passes a repository whose pending clips are all tracked', async () => {
    const result = await preflightPendingClips(repository)
    expect(result.ok).toBe(true)
  })

  it('refuses an untracked pending clip and names the fix', async () => {
    const clip = join(repository, 'clips', 'pending', 'untracked.md')
    writeFileSync(clip, 'fresh from harvest\n')
    const result = await preflightPendingClips(repository)
    rmSync(clip)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toContain('clips/pending/untracked.md')
    expect(result.reason).toContain('git -C')
    expect(result.reason).toContain('push')
  })

  it('ignores untracked files outside clips/pending', async () => {
    const stray = join(repository, 'stray.md')
    writeFileSync(stray, 'not a clip\n')
    const result = await preflightPendingClips(repository)
    rmSync(stray)

    expect(result.ok).toBe(true)
  })
})
