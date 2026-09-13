import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findUnreadableSources } from './find-unreadable-sources.ts'

const withPage = async (frontmatter: string): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'unreadable-'))
  await mkdir(join(root, 'topics'), { recursive: true })
  await mkdir(join(root, 'clips'), { recursive: true })
  await writeFile(join(root, 'topics', 'a.md'), frontmatter, 'utf8')
  return root
}

describe('findUnreadableSources', () => {
  it('reports an entry no reader opens', async () => {
    const root = await withPage(
      [
        '---',
        'sources:',
        '  - clips/processed/2026/07/...-01ky/',
        '---',
        'body',
      ].join('\n'),
    )
    const findings = await findUnreadableSources(root)
    expect(findings).toEqual([
      {
        check: 'unreadable-source',
        subject: 'topics/a.md',
        detail:
          'clips/processed/2026/07/...-01ky/ listed in sources and opened by no reader',
      },
    ])
  })

  it('reports nothing for an annotated url', async () => {
    const root = await withPage(
      [
        '---',
        'sources:',
        '  - https://x.com/polydao/status/2060715587387400424 (clipped 2026-07-27,',
        '    clip_id 01KYGGCN)',
        '---',
        'body',
      ].join('\n'),
    )
    expect(await findUnreadableSources(root)).toEqual([])
  })

  it('reports nothing for an absolute path into another repository', async () => {
    const root = await withPage(
      [
        '---',
        'sources:',
        '  - /Users/someone/p/other/README.md',
        '---',
        'body',
      ].join('\n'),
    )
    expect(await findUnreadableSources(root)).toEqual([])
  })

  it('reports nothing for a path that exists', async () => {
    const root = await withPage(
      ['---', 'sources:', '  - topics/a.md', '---', 'body'].join('\n'),
    )
    expect(await findUnreadableSources(root)).toEqual([])
  })
})
