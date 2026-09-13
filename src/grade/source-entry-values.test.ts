import { describe, expect, it } from 'vitest'
import { sourceEntryValues } from './source-entry-values.ts'

describe('sourceEntryValues', () => {
  it('reads bare entries', () => {
    expect(sourceEntryValues(['  - https://example.com/a'])).toEqual([
      'https://example.com/a',
    ])
  })

  it('stops a bare entry at its annotation and skips the continuation', () => {
    expect(
      sourceEntryValues([
        '  - https://x.com/a (clipped 2026-07-27,',
        '    clip_id 01KYGGCN)',
      ]),
    ).toEqual(['https://x.com/a'])
  })

  it('takes a quoted value whole, spaces and all', () => {
    expect(
      sourceEntryValues(["  - 'sources/vault/2026-08-22 NRC pago.pdf'"]),
    ).toEqual(['sources/vault/2026-08-22 NRC pago.pdf'])
  })

  it('rejoins a quoted value prettier wrapped across lines', () => {
    expect(
      sourceEntryValues([
        "  - 'sources/vault/business/2026-08-22 NRC",
        "    102622305046ZRM6XQYCZJ pago carta 010 Deluxe 100.pdf'",
        '  - https://example.com/b',
      ]),
    ).toEqual([
      'sources/vault/business/2026-08-22 NRC 102622305046ZRM6XQYCZJ pago carta 010 Deluxe 100.pdf',
      'https://example.com/b',
    ])
  })

  it('yields nothing for a quote the list never closes', () => {
    expect(sourceEntryValues(["  - 'sources/vault/a", '    b c'])).toEqual([])
  })
})
