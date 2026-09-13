import { execFileSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { captureStderr } from '../testing/capture-stderr.ts'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { pull } from './pull.ts'

const originAndClone = (): { origin: string; clone: string } => {
  const origin = temporaryDir('clips-origin-')
  const clone = temporaryDir('clips-clone-')

  execFileSync('git', ['init', '-q', '-b', 'main', origin])
  git(origin, 'config', 'user.email', 'test@example.com')
  git(origin, 'config', 'user.name', 'Test')
  writeFileSync(join(origin, 'README.md'), 'one\n')
  git(origin, 'add', '.')
  git(origin, 'commit', '-qm', 'one')
  rmSync(clone, { recursive: true, force: true })
  execFileSync('git', ['clone', '-q', origin, clone])
  git(clone, 'config', 'user.email', 'test@example.com')
  git(clone, 'config', 'user.name', 'Test')
  return { origin, clone }
}

/** Runs pull with stderr captured, so a test can assert which failure was
 * reported and not merely that one was. */
const runPull = async (
  ...args: Parameters<typeof pull>
): Promise<{ exitCode: number; stderr: string }> => {
  return captureStderr(async () => pull(...args))
}

describe('pull, a clone that already exists', () => {
  it('fast-forwards a clone that is behind', async () => {
    const { origin, clone } = originAndClone()
    writeFileSync(join(origin, 'README.md'), 'two\n')
    git(origin, 'commit', '-aqm', 'two')
    expect(await pull(clone)).toBe(EXIT_CODE.success)
    expect(git(clone, 'log', '-1', '--format=%s')).toBe('two')
  })

  it('is a no-op when already up to date', async () => {
    const { clone } = originAndClone()
    const before = git(clone, 'rev-parse', 'HEAD')
    expect(await pull(clone)).toBe(EXIT_CODE.success)
    expect(git(clone, 'rev-parse', 'HEAD')).toBe(before)
  })

  it('clones on a first-ever run', async () => {
    const { origin } = originAndClone()
    const destination = join(temporaryDir('clips-fresh-'), 'c')

    expect(await pull(destination, `file://${origin}`)).toBe(EXIT_CODE.success)
    expect(git(destination, 'log', '-1', '--format=%s')).toBe('one')
  })
})

describe('pull, failures that must not be conflated', () => {
  it('refuses to touch a clone whose history was rewritten', async () => {
    // Origin amended and the clone carries a commit origin does not have: a
    // genuine divergence, with a clean working tree so nothing else can
    // explain the refusal.
    const { origin, clone } = originAndClone()
    writeFileSync(join(origin, 'README.md'), 'rewritten\n')
    git(origin, 'commit', '-aqm', 'rewritten')
    git(origin, 'commit', '--amend', '-qm', 'rewritten again')
    writeFileSync(join(clone, 'local.md'), 'local\n')
    git(clone, 'add', '.')
    git(clone, 'commit', '-qm', 'local')
    const before = git(clone, 'rev-parse', 'HEAD')
    const { exitCode, stderr } = await runPull(clone)
    expect(exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(stderr).toMatch(/history was rewritten/)
    expect(git(clone, 'rev-parse', 'HEAD')).toBe(before)
  })

  it('names a dirty working tree as such, not as a rewritten history', async () => {
    // Verified: one uncommitted edit makes `git merge --ff-only origin/main`
    // exit 1 with "Your local changes would be overwritten". Reporting that as
    // a rewritten history sends the operator looking for a force-push that
    // never happened.
    const { origin, clone } = originAndClone()
    writeFileSync(join(origin, 'README.md'), 'two\n')
    git(origin, 'commit', '-aqm', 'two')
    writeFileSync(join(clone, 'README.md'), 'edited by hand\n')
    const { exitCode, stderr } = await runPull(clone)
    expect(exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(stderr).toMatch(/uncommitted changes/)
    expect(stderr).not.toMatch(/history was rewritten/)
  })

  it('reports a failed fetch as an exit code, not an unhandled rejection', async () => {
    // fetchOrigin and cloneRepository throw. Only fastForward used to be
    // guarded, so these escaped runCli and past the top-level await in
    // main.ts, printing ERR_UNHANDLED_REJECTION and a stack trace.
    const { origin, clone } = originAndClone()
    rmSync(origin, { recursive: true, force: true })
    const { exitCode, stderr } = await runPull(clone)
    expect(exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(stderr).not.toMatch(/ERR_UNHANDLED_REJECTION/)
    expect(stderr.trim()).not.toBe('')
  })
})
