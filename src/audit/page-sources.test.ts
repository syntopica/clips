import { describe, expect, it } from 'vitest'
import { pageSources } from './page-sources.ts'

const page = (sources: string): string =>
  ['---', 'title: A page', 'sources:', sources, '---', '', 'Body.'].join('\n')

describe('pageSources', () => {
  it('reads a plain list', () => {
    expect(
      pageSources(
        page(
          ['  - https://example.com/a', '  - https://example.com/b'].join('\n'),
        ),
      ),
    ).toEqual(['https://example.com/a', 'https://example.com/b'])
  })

  it('keeps an annotated entry, which used to vanish', () => {
    // The `- <url> (clipped ..., clip_id ...)` shape this wiki writes by hand,
    // wrapped by prettier. Dropping it does not just lower the count: it shifts
    // the index of every entry after it, so a correct marker stops resolving.
    const sources = [
      '  - https://x.com/polydao/status/2060715587387400424 (clipped 2026-07-27,',
      '    clip_id 01KYGGCNH0HN292WZ1VQGVR2XW; re-clipped 2026-07-29, clip_id',
      '    01KYNKY1AQ9W3Y)',
      '  - https://example.com/second',
    ].join('\n')

    expect(pageSources(page(sources))).toEqual([
      'https://x.com/polydao/status/2060715587387400424',
      'https://example.com/second',
    ])
  })

  it('never counts a continuation line as its own entry', () => {
    const sources = [
      '  - https://example.com/only (clipped 2026-07-27,',
      '    clip_id 01KYGGCNH0HN292WZ1VQGVR2XW)',
    ].join('\n')

    expect(pageSources(page(sources))).toHaveLength(1)
  })

  it('ignores a sources key repeated in the body', () => {
    const text = [
      page('  - https://example.com/a'),
      '',
      'sources:',
      '  - https://evil.example/b',
    ].join('\n')

    expect(pageSources(text)).toEqual(['https://example.com/a'])
  })
})
