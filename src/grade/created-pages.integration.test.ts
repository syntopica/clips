import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createdPages } from './created-pages.ts'

/** The one page the base commit already holds. */
const EXISTING_PAGE = 'existing.md'

let repository = ''
let baseSha = ''

beforeAll(() => {
  repository = mkdtempSync(join(tmpdir(), 'clips-created-pages-'))
  const git = (...args: string[]): string =>
    execFileSync('git', ['-C', repository, ...args], {
      encoding: 'utf8',
    }).trim()
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
  writeFileSync(join(repository, EXISTING_PAGE), 'one\n')
  git('add', '.')
  git('commit', '-qm', 'one')
  baseSha = git('rev-parse', 'HEAD')
})

afterAll(() => {
  rmSync(repository, { recursive: true, force: true })
})

describe('createdPages', () => {
  it('keeps only the paths absent from the base commit', async () => {
    expect(
      await createdPages(repository, baseSha, [EXISTING_PAGE, 'brand-new.md']),
    ).toEqual(['brand-new.md'])
  })

  it('returns nothing when every page already existed', async () => {
    expect(await createdPages(repository, baseSha, [EXISTING_PAGE])).toEqual([])
  })

  it('preserves the order it was given', async () => {
    expect(
      await createdPages(repository, baseSha, ['b.md', EXISTING_PAGE, 'a.md']),
    ).toEqual(['b.md', 'a.md'])
  })
})
