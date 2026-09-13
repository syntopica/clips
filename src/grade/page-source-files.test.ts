import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { pageSourceFiles } from './page-source-files.ts'

const THREAD_JSON = 'thread.json'

let brain = ''

beforeAll(() => {
  brain = mkdtempSync(join(tmpdir(), 'clips-source-files-'))
  mkdirSync(join(brain, 'sources', 'surveys'), { recursive: true })
  writeFileSync(join(brain, 'sources', 'surveys', 'one.json'), '{}')
  writeFileSync(join(brain, 'sources', THREAD_JSON), '{}')
})

afterAll(() => {
  rmSync(brain, { recursive: true, force: true })
})

const page = (entries: string[]): string =>
  `---\ntitle: t\nsources:\n${entries.map((entry) => `  - ${entry}\n`).join('')}---\n\nbody\n`

describe('pageSourceFiles', () => {
  it('resolves repository-local sources to absolute paths', () => {
    expect(pageSourceFiles(brain, page(['sources/surveys/one.json']))).toEqual([
      join(brain, 'sources', 'surveys', 'one.json'),
    ])
  })

  it('leaves urls to pageSourceUrls', () => {
    expect(
      pageSourceFiles(
        brain,
        page(['https://example.com/a', 'sources/thread.json']),
      ),
    ).toEqual([join(brain, 'sources', THREAD_JSON)])
  })

  it('leaves a vexa:// identity to pageSourceUrls', () => {
    expect(
      pageSourceFiles(
        brain,
        page(['vexa://kube.today/weekly/an-issue', 'sources/thread.json']),
      ),
    ).toEqual([join(brain, 'sources', THREAD_JSON)])
  })

  it('drops a path that escapes the repository', () => {
    // `sources:` is frontmatter a model wrote from untrusted material, so a
    // traversal is a shape this has to refuse rather than a case that cannot
    // happen. It is dropped silently, exactly like a path that is not there.
    expect(
      pageSourceFiles(
        brain,
        page(['../../../../etc/passwd', 'sources/thread.json']),
      ),
    ).toEqual([join(brain, 'sources', THREAD_JSON)])
  })

  it('drops a local path that does not exist', () => {
    expect(pageSourceFiles(brain, page(['sources/gone.json']))).toEqual([])
  })

  it('reads nothing outside frontmatter', () => {
    const body = `---\ntitle: t\n---\n\nsources:\n  - sources/thread.json\n`

    expect(pageSourceFiles(brain, body)).toEqual([])
  })

  it('stops at the end of the sources list', () => {
    const text = `---\nsources:\n  - sources/thread.json\nupdated: 2026-08-02\n  - sources/surveys/one.json\n---\n\nbody\n`

    expect(pageSourceFiles(brain, text)).toEqual([
      join(brain, 'sources', THREAD_JSON),
    ])
  })
})
