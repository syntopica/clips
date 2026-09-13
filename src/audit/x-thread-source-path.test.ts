import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { xThreadSourcePath } from './x-thread-source-path.ts'

const roots: string[] = []
afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

const brainWith = (files: string[]): string => {
  const root = mkdtempSync(join(tmpdir(), 'clips-xthread-'))
  roots.push(root)
  for (const file of files) {
    mkdirSync(join(root, file, '..'), { recursive: true })
    writeFileSync(join(root, file), '{}')
  }
  return root
}

describe('xThreadSourcePath', () => {
  it('resolves a status url to a sweep-subdirectory thread file', () => {
    const brain = brainWith(['sources/x/tabs-20260807/thread-123.json'])

    expect(xThreadSourcePath(brain, 'https://x.com/someone/status/123')).toBe(
      join(brain, 'sources', 'x', 'tabs-20260807', 'thread-123.json'),
    )
  })

  it('resolves a status url to a stamped root-level thread file', () => {
    const brain = brainWith(['sources/x/thread-123-20260811-120000.json'])

    expect(
      xThreadSourcePath(brain, 'https://twitter.com/someone/status/123'),
    ).toBe(join(brain, 'sources', 'x', 'thread-123-20260811-120000.json'))
  })

  it('does not let one id match another it prefixes', () => {
    const brain = brainWith(['sources/x/tabs-20260807/thread-1234.json'])

    expect(xThreadSourcePath(brain, 'https://x.com/a/status/123')).toBeNull()
  })

  it('ignores raw scrape debris', () => {
    const brain = brainWith(['sources/x/thread-123-20260811.json.raw'])

    expect(xThreadSourcePath(brain, 'https://x.com/a/status/123')).toBeNull()
  })

  it('answers null for a non-status url and for a missing sources/x', () => {
    const brain = brainWith([])

    expect(xThreadSourcePath(brain, 'https://example.com/post/123')).toBeNull()
    expect(xThreadSourcePath(brain, 'https://x.com/a/status/123')).toBeNull()
  })
})
