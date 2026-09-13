import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import { brainWith } from './brain-fixture.ts'
import { findUnresolvedCitations } from './find-unresolved-citations.ts'

const CITED_URL = 'https://medium.com/@a/x-000000000001'

const page = (urls: string[]): string =>
  `---\ntitle: t\ntype: topic\nsources:\n${urls.map((url) => `  - ${url}\n`).join('')}---\n\nbody\n`

const clipFor = (url: string): Clip =>
  ({
    kind: 'clip',
    directory: '/nowhere',
    bucket: 'processed',
    metadata: { normalized_url: url },
    state: {},
  }) as unknown as Clip

describe('findUnresolvedCitations', () => {
  it('reports the shortfall between cited urls and clips on disk', async () => {
    const brain = brainWith({
      'topics/a.md': page([CITED_URL, 'https://example.com/gone']),
    })

    expect(await findUnresolvedCitations(brain, [clipFor(CITED_URL)])).toEqual([
      {
        check: 'unresolved-citation',
        subject: 'topics/a.md',
        detail:
          '1 of 2 cited urls have no clip on disk: https://example.com/gone',
      },
    ])
  })

  it('resolves an X status url against a scraped thread on disk', async () => {
    const brain = brainWith({
      'topics/a.md': page(['https://x.com/someone/status/123']),
      'sources/x/tabs-20260807/thread-123.json': '{}',
    })

    expect(await findUnresolvedCitations(brain, [])).toEqual([])
  })

  it('says nothing about a page that cites no urls', async () => {
    const brain = brainWith({ 'topics/a.md': '---\ntitle: t\n---\n\nbody\n' })

    expect(await findUnresolvedCitations(brain, [])).toEqual([])
  })

  it('matches on the dedup key, not the url spelling', async () => {
    // One Medium post reaches the store under several host spellings; comparing
    // verbatim would report evidence that is sitting right there as missing.
    const brain = brainWith({
      'topics/a.md': page(['https://medium.com/@author/post-abcdef123456']),
    })

    expect(
      await findUnresolvedCitations(brain, [
        clipFor('https://author.medium.com/post-abcdef123456'),
      ]),
    ).toEqual([])
  })

  it('ignores files outside the page directories', async () => {
    const brain = brainWith({
      'docs/a.md': page(['https://example.com/gone']),
      'topics/b.md': '---\ntitle: t\n---\n\nbody\n',
    })

    expect(await findUnresolvedCitations(brain, [])).toEqual([])
  })
})

describe('counting urls rather than paths', () => {
  it('says nothing when two cited spellings share one clip', async () => {
    const brain = brainWith({
      'topics/a.md': page([CITED_URL, 'https://a.medium.com/x-000000000001']),
    })

    expect(await findUnresolvedCitations(brain, [clipFor(CITED_URL)])).toEqual(
      [],
    )
  })

  it('reports a missing url even when another matches two clips', async () => {
    const brain = brainWith({
      'topics/a.md': page([
        'https://example.com/have',
        'https://example.com/gone',
      ]),
    })

    expect(
      await findUnresolvedCitations(brain, [
        clipFor('https://example.com/have'),
        clipFor('https://example.com/have/'),
      ]),
    ).toEqual([
      {
        check: 'unresolved-citation',
        subject: 'topics/a.md',
        detail:
          '1 of 2 cited urls have no clip on disk: https://example.com/gone',
      },
    ])
  })
})
