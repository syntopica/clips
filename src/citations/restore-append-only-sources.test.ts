import { describe, expect, it } from 'vitest'
import { restoreAppendOnlySources } from './restore-append-only-sources.ts'

const page = (sources: string, body = 'A claim [S1]. Another [S2].') =>
  `---\ntitle: X\nsources:\n${sources}updated: 2026-10-05\n---\n\n${body}\n`

const COMMITTED = page('  - https://a.example\n  - "https://b.example"\n')

describe('restoreAppendOnlySources', () => {
  it('puts the committed entries back in order and appends the new ones', () => {
    const proposed = page(
      '  - https://new.example\n  - "https://b.example"\n  - https://a.example\n',
    )

    expect(restoreAppendOnlySources(COMMITTED, proposed)).toBe(
      page(
        '  - https://a.example\n  - "https://b.example"\n  - https://new.example\n',
      ),
    )
  })

  it('restores an entry the rewrite dropped', () => {
    const proposed = page('  - https://b.example\n  - https://new.example\n')

    expect(restoreAppendOnlySources(COMMITTED, proposed)).toBe(
      page(
        '  - https://a.example\n  - "https://b.example"\n  - https://new.example\n',
      ),
    )
  })

  it('leaves a page whose list only appended untouched', () => {
    const proposed = page(
      '  - https://a.example\n  - "https://b.example"\n  - https://new.example\n',
    )

    expect(restoreAppendOnlySources(COMMITTED, proposed)).toBe(proposed)
  })

  it('leaves a page without claim markers untouched', () => {
    const proposed = page('  - https://b.example\n', 'No markers here.')

    expect(restoreAppendOnlySources(COMMITTED, proposed)).toBe(proposed)
  })
})
