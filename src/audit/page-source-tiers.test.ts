import { describe, expect, it } from 'vitest'
import { pageSourceTiers } from './page-source-tiers.ts'

const page = (sources: string): string =>
  `---\ntitle: A\ntype: topic\nupdated: 2026-08-03\nsources:\n${sources}---\n\nBody.\n`

describe('pageSourceTiers', () => {
  it('orders the tiers by the ranking, not by the order they are listed', () => {
    const text = page(
      '  - https://x.com/someone/status/1\n  - https://example.org/a\n  - sources/x/thread.md\n',
    )

    expect(pageSourceTiers(text)).toEqual(['primary', 'web', 'social'])
  })

  it('reports each tier once however many sources land in it', () => {
    const text = page('  - https://a.example/1\n  - https://b.example/2\n')

    expect(pageSourceTiers(text)).toEqual(['web'])
  })

  it('is empty for a page that cites nothing', () => {
    expect(
      pageSourceTiers('---\ntitle: A\ntype: topic\n---\n\nBody.\n'),
    ).toEqual([])
  })

  it('reads no sources out of the body', () => {
    // The field name in a paragraph is prose, the rule frontmatterListLines
    // already holds. Checked here because a page about this wiki writes
    // `sources:` in its own text.
    const text = `---\ntitle: A\ntype: topic\n---\n\nsources:\n  - https://x.com/a\n`

    expect(pageSourceTiers(text)).toEqual([])
  })
})
