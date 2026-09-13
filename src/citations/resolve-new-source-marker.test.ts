import { describe, expect, it } from 'vitest'
import { resolveNewSourceMarker } from './resolve-new-source-marker.ts'

const page = (sources: readonly string[], body: string): string =>
  [
    '---',
    'title: A page',
    'sources:',
    ...sources.map((source) => `  - ${source}`),
    '---',
    '',
    body,
  ].join('\n')

describe('resolveNewSourceMarker', () => {
  it('resolves SNEW to the position of the last source', () => {
    const text = page(
      [
        'https://example.com/a',
        'https://example.com/b',
        'https://example.com/c',
      ],
      'A claim the source makes [SNEW].',
    )

    expect(resolveNewSourceMarker(text)).toContain('[S3]')
    expect(resolveNewSourceMarker(text)).not.toContain('[SNEW]')
  })

  it('resolves every occurrence, not just the first', () => {
    const text = page(
      ['https://example.com/a'],
      'One claim [SNEW]. Another claim [SNEW].',
    )

    expect(resolveNewSourceMarker(text).match(/\[S1\]/gu)).toHaveLength(2)
  })

  it('counts an annotated entry, which the marker has to agree with', () => {
    const text = [
      '---',
      'sources:',
      '  - https://example.com/a (clipped 2026-07-27, clip_id',
      '    01KYGGCNH0HN292WZ1VQGVR2XW)',
      '  - https://example.com/b',
      '---',
      '',
      'A claim [SNEW].',
    ].join('\n')

    expect(resolveNewSourceMarker(text)).toContain('[S2]')
  })

  it('leaves the marker alone on a page with no sources', () => {
    // Producing [S0] would invent a position; the existing "names no entry"
    // failure is the honest report.
    const text = ['---', 'title: A page', '---', '', 'A claim [SNEW].'].join(
      '\n',
    )

    expect(resolveNewSourceMarker(text)).toContain('[SNEW]')
  })

  it('leaves a page without the marker byte-identical', () => {
    const text = page(['https://example.com/a'], 'A claim [S1].')

    expect(resolveNewSourceMarker(text)).toBe(text)
  })
})

describe('resolveNewSourceMarker, the unbracketed label', () => {
  it('resolves a bare SNEW at the start of a source-list line', () => {
    const text = [
      '---',
      'sources:',
      '  - https://one.example',
      '  - https://two.example',
      '---',
      '',
      'A claim [SNEW].',
      '',
      '## Sources',
      '',
      '- S1 - https://one.example',
      '- SNEW - https://two.example',
    ].join('\n')
    const resolved = resolveNewSourceMarker(text)
    expect(resolved).toContain('- S2 - https://two.example')
    expect(resolved).not.toContain('SNEW')
  })

  it('leaves the word alone in prose', () => {
    const text = [
      '---',
      'sources:',
      '  - https://one.example',
      '---',
      '',
      'The marker SNEW means the source this clip appended.',
    ].join('\n')
    expect(resolveNewSourceMarker(text)).toContain('marker SNEW means')
  })
})
