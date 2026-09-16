import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { newRepositoryWithOrigin } from '../state/clip-state-fixture-new-repository-with-origin.ts'
import { captureStderr } from '../testing/capture-stderr.ts'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { pull } from './pull.ts'

const CLIP = 'clips/pending/2026/09/2026-09-16-example-com-page-01k0000a'

/** An inbox origin with one clipper commit, and a clone of it the way the
 * instance would hold one. `clipper` stands in for the browser extension,
 * which commits through the GitHub API and never sees the clone. */
const inboxFixture = (): { origin: string; clone: string; clipper: string } => {
  const origin = temporaryDir('clips-inbox-origin-')
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin])
  const clipper = temporaryDir('clips-clipper-')
  execFileSync('git', ['clone', '-q', origin, clipper])
  git(clipper, 'config', 'user.email', 'test@example.com')
  git(clipper, 'config', 'user.name', 'Test')
  writeFileSync(join(clipper, 'README.md'), '# inbox\n')
  git(clipper, 'add', '.')
  git(clipper, 'commit', '-qm', 'inbox')
  git(clipper, 'push', '-q', '-u', 'origin', 'main')
  const clone = temporaryDir('clips-inbox-clone-')
  rmSync(clone, { recursive: true, force: true })
  execFileSync('git', ['clone', '-q', origin, clone])
  git(clone, 'config', 'user.email', 'test@example.com')
  git(clone, 'config', 'user.name', 'Test')
  return { origin, clone, clipper }
}

const clipInto = (repository: string, path: string, clipId: string): void => {
  mkdirSync(join(repository, path), { recursive: true })
  writeFileSync(
    join(repository, path, 'metadata.json'),
    `${JSON.stringify({ clip_id: clipId })}\n`,
  )
  writeFileSync(join(repository, path, 'index.md'), '# page\n')
  git(repository, 'add', '.')
  git(repository, 'commit', '-qm', `Clip ${clipId}`)
  git(repository, 'push', '-q', 'origin', 'main')
}

/** The archive lives inside the brain, as the instance lays it out. */
const brainWithArchive = (): { brain: string; archive: string } => {
  const brain = newRepositoryWithOrigin()
  const archive = join(brain, 'clips')
  mkdirSync(archive, { recursive: true })
  return { brain, archive }
}

const runPull = async (
  ...args: Parameters<typeof pull>
): Promise<{ exitCode: number; stderr: string }> =>
  captureStderr(async () => pull(...args))

describe('pull, handing the inbox to the archive', () => {
  it('copies a fresh pending clip into the archive, pushes it, then empties the inbox', async () => {
    const { brain, archive } = brainWithArchive()
    const { origin, clone, clipper } = inboxFixture()
    clipInto(clipper, CLIP, '01K0000A')

    expect(await pull(brain, archive, clone)).toBe(EXIT_CODE.success)

    expect(existsSync(join(archive, CLIP, 'index.md'))).toBe(true)
    expect(git(brain, 'log', '-1', '--format=%s')).toBe(
      'chore(clips): collect 1 clips from the inbox',
    )
    expect(git(brain, 'rev-parse', 'origin/main')).toBe(
      git(brain, 'rev-parse', 'HEAD'),
    )
    expect(git(clone, 'log', '-1', '--format=%s')).toBe(
      'chore(inbox): hand 1 clips to the archive',
    )
    expect(git(origin, 'ls-tree', '-r', '--name-only', 'main')).toBe(
      'README.md',
    )
  })

  it('clones the inbox on a first-ever run', async () => {
    // A fresh clone has no local identity for the hand-over commit; the
    // instance's global git configuration supplies one, and here the
    // environment stands in for it.
    for (const role of ['AUTHOR', 'COMMITTER']) {
      vi.stubEnv(`GIT_${role}_NAME`, 'Test')
      vi.stubEnv(`GIT_${role}_EMAIL`, 'test@example.com')
    }
    const { brain, archive } = brainWithArchive()
    const { origin, clipper } = inboxFixture()
    clipInto(clipper, CLIP, '01K0000A')
    const inbox = join(temporaryDir('clips-inbox-fresh-'), 'inbox')

    expect(await pull(brain, archive, inbox, `file://${origin}`)).toBe(
      EXIT_CODE.success,
    )
    expect(existsSync(join(archive, CLIP, 'metadata.json'))).toBe(true)
    expect(git(inbox, 'ls-tree', '-r', '--name-only', 'HEAD')).toBe('README.md')
  })

  it('removes without copying a clip the archive already holds in another bucket', async () => {
    const { brain, archive } = brainWithArchive()
    const { clone, clipper } = inboxFixture()
    clipInto(clipper, CLIP, '01K0000A')
    const processed = CLIP.replace('clips/pending/', 'clips/processed/')
    mkdirSync(join(archive, processed), { recursive: true })
    writeFileSync(join(archive, processed, 'index.md'), '# done\n')
    git(brain, 'add', '.')
    git(brain, 'commit', '-qm', 'processed already')
    const before = git(brain, 'rev-parse', 'HEAD')

    expect(await pull(brain, archive, clone)).toBe(EXIT_CODE.success)

    expect(existsSync(join(archive, CLIP))).toBe(false)
    expect(git(brain, 'rev-parse', 'HEAD')).toBe(before)
    expect(git(clone, 'ls-tree', '-r', '--name-only', 'HEAD')).toBe('README.md')
  })

  it('is a no-op on an empty inbox', async () => {
    const { brain, archive } = brainWithArchive()
    const { clone } = inboxFixture()
    const before = git(brain, 'rev-parse', 'HEAD')
    const inboxBefore = git(clone, 'rev-parse', 'HEAD')
    expect(await pull(brain, archive, clone)).toBe(EXIT_CODE.success)
    expect(git(brain, 'rev-parse', 'HEAD')).toBe(before)
    expect(git(clone, 'rev-parse', 'HEAD')).toBe(inboxBefore)
  })
})

describe('pull, failures that must not be conflated', () => {
  it('refuses an instance with no inbox configured', async () => {
    const { brain, archive } = brainWithArchive()
    const { exitCode, stderr } = await runPull(brain, archive, null)
    expect(exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(stderr).toMatch(/clips\.inbox is not configured/)
  })

  it('refuses to touch an inbox clone whose history was rewritten', async () => {
    const { brain, archive } = brainWithArchive()
    const { clone, clipper } = inboxFixture()
    writeFileSync(join(clipper, 'README.md'), 'rewritten\n')
    git(clipper, 'commit', '-aqm', 'rewritten')
    git(clipper, 'push', '-q', '--force', 'origin', 'main')
    writeFileSync(join(clone, 'local.md'), 'local\n')
    git(clone, 'add', '.')
    git(clone, 'commit', '-qm', 'local')
    const before = git(clone, 'rev-parse', 'HEAD')
    const { exitCode, stderr } = await runPull(brain, archive, clone)
    expect(exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(stderr).toMatch(/history was rewritten/)
    expect(git(clone, 'rev-parse', 'HEAD')).toBe(before)
  })

  it('names a dirty inbox working tree as such', async () => {
    const { brain, archive } = brainWithArchive()
    const { clone } = inboxFixture()
    writeFileSync(join(clone, 'README.md'), 'edited by hand\n')
    const { exitCode, stderr } = await runPull(brain, archive, clone)
    expect(exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(stderr).toMatch(/uncommitted changes/)
  })

  it('reports a failed clone as an exit code, not an unhandled rejection', async () => {
    const { brain, archive } = brainWithArchive()
    const inbox = join(temporaryDir('clips-inbox-missing-'), 'inbox')
    const { exitCode, stderr } = await runPull(
      brain,
      archive,
      inbox,
      'file:///nowhere/at/all',
    )
    expect(exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(stderr).not.toMatch(/ERR_UNHANDLED_REJECTION/)
    expect(stderr.trim()).not.toBe('')
  })
})
