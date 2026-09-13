import { describe, expect, it } from 'vitest'
import { formatTriageEntry } from './format-triage-entry.ts'
import type { TriagedArticle } from './triaged-article.ts'

const article = (overrides: Partial<TriagedArticle> = {}): TriagedArticle => ({
  url: 'https://medium.com/@joe.njenga/claude-code-ultraplan-21a628332e97',
  title: 'Claude Code Ultraplan Launched',
  firstSeen: '2026-07-28',
  bucket: 'ingest',
  topic: 'ai-agents',
  reason: 'Claude Code planning workflow relevant',
  ...overrides,
})

describe('formatTriageEntry', () => {
  it('writes a plain bullet for an ingested article', () => {
    expect(formatTriageEntry(article())).toBe(
      '- [Claude Code Ultraplan Launched](https://medium.com/@joe.njenga/claude-code-ultraplan-21a628332e97) - Claude Code planning workflow relevant',
    )
  })

  it('writes a checkbox only for review, which is what --promote reads back', () => {
    expect(formatTriageEntry(article({ bucket: 'review' }))).toMatch(
      /^- \[ \] \[/,
    )
    expect(formatTriageEntry(article({ bucket: 'ingest' }))).toMatch(/^- \[/)
    expect(formatTriageEntry(article({ bucket: 'rejected' }))).toMatch(/^- \[/)
  })

  it('keeps a bracketed title from closing the link early', () => {
    const line = formatTriageEntry(
      article({ title: 'Part 1: React [2026] Naming Conventions' }),
    )
    expect(line).toContain('[Part 1: React (2026) Naming Conventions]')
    expect(line.match(/\]\(/g)).toHaveLength(1)
  })
})
