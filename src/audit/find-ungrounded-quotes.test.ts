import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import { findUngroundedQuotes } from './find-ungrounded-quotes.ts'

const SOURCE_PATH = 'sources/x/thread.md'

const roots: string[] = []
afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

const brainWith = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), 'clips-audit-'))
  roots.push(root)
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), body)
  }
  return root
}

const page = (sources: readonly string[], body: string): string =>
  `---\ntitle: t\ntype: topic\nupdated: 2026-08-03\nsources:\n${sources.map((source) => `  - ${source}\n`).join('')}---\n\n${body}\n`

const clipAt = (directory: string, normalizedUrl: string): Clip =>
  ({
    kind: 'clip',
    directory,
    bucket: 'processed',
    metadata: { normalized_url: normalizedUrl },
    state: { status: 'processed' },
  }) as Clip

describe('findUngroundedQuotes', () => {
  it('reports a quotation the marked source does not contain', async () => {
    const brain = brainWith({
      [SOURCE_PATH]: 'The author wrote that the loop is the design.',
      'topics/a.md': page(
        [SOURCE_PATH],
        'The thread says "the loop is the whole design here" [S1].',
      ),
    })

    return expect(findUngroundedQuotes(brain, [])).resolves.toEqual([
      {
        check: 'ungrounded-quote',
        subject: 'topics/a.md',
        detail:
          '[S1] is quoted "the loop is the whole design here" and the source does not contain it',
      },
    ])
  })

  it('accepts a quotation the source contains under different typography', async () => {
    const brain = brainWith({
      [SOURCE_PATH]: 'He wrote: “the loop\n  is the design”, once.',
      'topics/a.md': page(
        [SOURCE_PATH],
        'The thread says "the loop is the design" [S1].',
      ),
    })

    expect(await findUngroundedQuotes(brain, [])).toEqual([])
  })

  it('grounds a quotation against the clip its cited url resolves to', async () => {
    const store = brainWith({
      'clip/index.md': 'The post says the harness owns the state.',
    })
    const brain = brainWith({
      'topics/a.md': page(
        ['https://medium.com/@a/one-000000000001'],
        'The post says "the harness owns all of the state" [S1].',
      ),
    })

    expect(
      await findUngroundedQuotes(brain, [
        clipAt(join(store, 'clip'), 'https://medium.com/@a/one-000000000001'),
      ]),
    ).toEqual([
      {
        check: 'ungrounded-quote',
        subject: 'topics/a.md',
        detail:
          '[S1] is quoted "the harness owns all of the state" and the source does not contain it',
      },
    ])
  })

  it('says nothing about an OWN quotation, which no source could contain', async () => {
    const brain = brainWith({
      'topics/a.md': page(
        [SOURCE_PATH],
        'I said "the loop is the whole design here" [OWN].',
      ),
    })

    expect(await findUngroundedQuotes(brain, [])).toEqual([])
  })

  it('is silent on a grandfathered page, whose quotations carry no marker', async () => {
    const brain = brainWith({
      [SOURCE_PATH]: 'Nothing of the sort appears in here.',
      'topics/a.md': page(
        [SOURCE_PATH],
        'The thread says "the loop is the whole design here".',
      ),
    })

    expect(await findUngroundedQuotes(brain, [])).toEqual([])
  })

  it('leaves a marker naming a source the page does not have to the lint', async () => {
    const brain = brainWith({
      'topics/a.md': page(
        [SOURCE_PATH],
        'The thread says "the loop is the whole design here" [S4].',
      ),
    })

    expect(await findUngroundedQuotes(brain, [])).toEqual([])
  })
})
