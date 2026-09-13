import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { git } from '../testing/git.ts'
import { initGitRepo } from '../testing/init-git-repo.ts'
import { AmbiguousCommitError } from './ambiguous-commit-error.ts'
import { GitFailedError } from './git-failed-error.ts'
import { resolveCommit } from './resolve-commit.ts'

const PREFIX_LENGTH = 4
const MAX_BLOBS = 5000

let repository = ''
let head = ''
let ambiguousPrefix = ''

// Git's blob object id is sha1('blob ' + byteLength + NUL + content). Computed
// in process so the collision search never spawns a subprocess.
const gitBlobSha1 = (content: string): string => {
  const bytes = Buffer.from(content, 'utf8')
  const header = Buffer.from(`blob ${String(bytes.length)}\u0000`)
  return createHash('sha1')
    .update(Buffer.concat([header, bytes]))
    .digest('hex')
}

beforeAll(() => {
  repository = mkdtempSync(join(tmpdir(), 'clips-git-'))
  initGitRepo(repository)
  writeFileSync(join(repository, 'a.md'), 'one\n')
  git(repository, 'add', '.')
  git(repository, 'commit', '-qm', 'one')
  head = git(repository, 'rev-parse', 'HEAD')

  // Force a genuine four-character prefix collision by hashing in process
  // (no subprocess per candidate) rather than spawning `git hash-object` per
  // candidate: up to 5000 sequential execFileSync calls landed right against
  // vitest's default 10s hookTimeout on a cold run, making the fixture flaky
  // rather than merely slow. Only the two colliding contents are ever
  // written to the real repository, via exactly two subprocess calls below.
  const seenContents = new Map<string, string>()
  let winners: [string, string] | null = null
  for (let i = 0; i < MAX_BLOBS && winners === null; i += 1) {
    const content = `blob-${String(i)}\n`
    const prefix = gitBlobSha1(content).slice(0, PREFIX_LENGTH)
    const existing = seenContents.get(prefix)
    if (existing !== undefined) {
      winners = [existing, content]
      ambiguousPrefix = prefix
    } else {
      seenContents.set(prefix, content)
    }
  }
  if (winners !== null) {
    for (const content of winners) {
      execFileSync('git', ['-C', repository, 'hash-object', '-w', '--stdin'], {
        input: content,
        encoding: 'utf8',
      })
    }
  }
})

afterAll(() => {
  rmSync(repository, { recursive: true, force: true })
})

describe('resolveCommit', () => {
  it('expands an abbreviated sha to the full one', async () => {
    expect(await resolveCommit(repository, head.slice(0, 7))).toBe(head)
  })

  it('returns the full sha unchanged', async () => {
    expect(await resolveCommit(repository, head)).toBe(head)
  })

  it('throws for a sha that does not exist', async () => {
    await expect(resolveCommit(repository, 'deadbee')).rejects.toThrow()
  })

  it('throws GitFailedError specifically for a sha that does not exist', async () => {
    await expect(resolveCommit(repository, 'deadbee')).rejects.toBeInstanceOf(
      GitFailedError,
    )
  })

  it('never resolves an ambiguous abbreviation arbitrarily', async () => {
    expect(ambiguousPrefix).not.toBe('')
    await expect(
      resolveCommit(repository, ambiguousPrefix),
    ).rejects.toBeInstanceOf(AmbiguousCommitError)
  })
})
