import { describe, expect, it } from 'vitest'
import { InvalidSyntopicaConfigError } from '../config/invalid-syntopica-config-error.ts'
import { wikiLayoutOf } from './wiki-layout-of.ts'

describe('wikiLayoutOf', () => {
  it('reads a flat wiki as pages at the repository root', () => {
    expect(
      wikiLayoutOf({
        dataRoot: '/data',
        pages: ['/data/topics', '/data/projects'],
        sources: '/data/sources',
        index: '/data/index.md',
        ledger: '/data/.ingest',
      }),
    ).toEqual({
      pageRoot: '',
      pageDirectories: ['topics', 'projects'],
      index: 'index.md',
      sources: 'sources',
      ledger: '.ingest',
    })
  })

  it('reads a nested wiki with the index directory as the page root', () => {
    // The owner's instance since 2026-09-14: page ids stay `topics/x`, while
    // git and the ledger directory are spelled from the repository root.
    expect(
      wikiLayoutOf({
        dataRoot: '/data',
        pages: ['/data/brain/topics', '/data/brain/people'],
        sources: '/data/brain/sources',
        index: '/data/brain/index.md',
        ledger: '/data/brain/.ingest',
      }),
    ).toEqual({
      pageRoot: 'brain',
      pageDirectories: ['topics', 'people'],
      index: 'index.md',
      sources: 'brain/sources',
      ledger: 'brain/.ingest',
    })
  })

  it('refuses a page directory outside the page root', () => {
    expect(() =>
      wikiLayoutOf({
        dataRoot: '/data',
        pages: ['/data/topics'],
        sources: '/data/brain/sources',
        index: '/data/brain/index.md',
        ledger: '/data/brain/.ingest',
      }),
    ).toThrow(InvalidSyntopicaConfigError)
  })

  it('refuses the page root itself as a page directory', () => {
    expect(() =>
      wikiLayoutOf({
        dataRoot: '/data',
        pages: ['/data/brain'],
        sources: '/data/brain/sources',
        index: '/data/brain/index.md',
        ledger: '/data/brain/.ingest',
      }),
    ).toThrow(InvalidSyntopicaConfigError)
  })
})
