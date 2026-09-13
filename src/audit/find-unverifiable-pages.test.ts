import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import { findUnverifiablePages } from './find-unverifiable-pages.ts'

const roots: string[] = []
afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

const brainWith = (pages: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), 'clips-unverifiable-'))
  roots.push(root)
  for (const [path, body] of Object.entries(pages)) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), body)
  }
  return root
}

const page = (...sources: string[]): string =>
  `---\ntitle: t\ntype: topic\nupdated: 2026-08-03\nsummary: 's'\nsources:\n${sources.map((s) => `  - ${s}\n`).join('')}---\n\nbody\n`

const CLIP_URL = 'https://medium.com/@a/one-000000000001'

const clip = (): Clip =>
  ({
    kind: 'clip',
    directory: '/store/one',
    bucket: 'pending',
    metadata: { normalized_url: CLIP_URL },
    state: { status: 'pending' },
  }) as Clip

describe('findUnverifiablePages', () => {
  it('says nothing about a page whose cited clip is on disk', async () => {
    const brain = brainWith({ 'topics/a.md': page(CLIP_URL) })

    expect(await findUnverifiablePages(brain, [clip()])).toEqual([])
  })

  it('says nothing about a page citing a readable file in the repository', async () => {
    const brain = brainWith({
      'topics/a.md': page('topics/b.md'),
      'topics/b.md': page(CLIP_URL),
    })

    expect(await findUnverifiablePages(brain, [clip()])).toEqual([])
  })

  it('reports a page with no evidence and no exemption', async () => {
    const brain = brainWith({ 'business/access.md': page('the owner') })

    expect(await findUnverifiablePages(brain, [])).toEqual([
      {
        check: 'unverifiable-page',
        subject: 'business/access.md',
        detail:
          'cites no evidence on disk and claims no exemption; add sources or `verification: exempt`',
      },
    ])
  })

  it('names the count when the citations are urls with no clip behind them', async () => {
    const brain = brainWith({ 'topics/a.md': page(CLIP_URL) })

    expect((await findUnverifiablePages(brain, []))[0]?.detail).toBe(
      'cites 1 url(s) with no clip on disk and claims no exemption; add `verification: exempt`',
    )
  })

  it('clears once the page declares the exemption', async () => {
    const brain = brainWith({
      'business/access.md': page('the owner').replace(
        'sources:',
        'verification: exempt\nsources:',
      ),
    })

    expect(await findUnverifiablePages(brain, [])).toEqual([])
  })
})
