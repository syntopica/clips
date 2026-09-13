import { describe, expect, it } from 'vitest'
import { ClipMetadataSchema } from '../../clips/clip-metadata-schema.ts'
import type { ClipMetadata } from '../../clips/clip-metadata.ts'
import { buildFrontmatter } from './build-frontmatter.ts'

const metadata = (overrides: Partial<ClipMetadata> = {}): ClipMetadata => ({
  schema_version: 1,
  clip_id: '01KYNM2FHGCRDYJ1NZ57TXS2GR',
  title: 'Agent Memory',
  url: 'https://medium.com/@a/agent-memory-000000000001',
  normalized_url: 'https://medium.com/@a/agent-memory-000000000001',
  canonical_url: null,
  site: 'medium.com',
  author: 'A Writer',
  published: null,
  language: 'en',
  clipped_at: '2026-07-29T12:00:00Z',
  clipped_from: 'clips-harvest',
  extension_version: '0.1.0',
  extractor: 'article',
  site_extractor: true,
  extractor_version: null,
  snapshot_mode: 'extracted',
  sensitivity: 'public',
  content_sha256: 'a'.repeat(64),
  source_html_sha256: 'b'.repeat(64),
  asset_count: 0,
  asset_failures: [],
  note: '',
  tags: [],
  word_count: 900,
  ...overrides,
})

describe('buildFrontmatter', () => {
  it('opens and closes with the delimiter', () => {
    const out = buildFrontmatter(metadata())
    expect(out.startsWith('---\n')).toBe(true)
    expect(out.endsWith('\n---\n')).toBe(true)
  })

  it('quotes a title that YAML would otherwise reinterpret', () => {
    expect(buildFrontmatter(metadata({ title: 'no: really' }))).toContain(
      'title: "no: really"',
    )
    expect(buildFrontmatter(metadata({ title: '- leading dash' }))).toContain(
      'title: "- leading dash"',
    )
    expect(buildFrontmatter(metadata({ title: 'yes' }))).toContain(
      'title: "yes"',
    )
  })

  it('writes null unquoted so it parses as null, not the string', () => {
    expect(buildFrontmatter(metadata({ author: null }))).toContain(
      'author: null',
    )
  })

  it('writes an empty array inline and a populated one as a block', () => {
    expect(buildFrontmatter(metadata({ tags: [] }))).toContain('tags: []')
    expect(buildFrontmatter(metadata({ tags: ['ai', 'agents'] }))).toContain(
      'tags:\n  - "ai"\n  - "agents"',
    )
  })

  it('emits metadata the reader schema accepts, round-tripped', () => {
    const source = metadata({ title: 'Quotes "inside" and: colons' })
    const body = buildFrontmatter(source)
    const parsed: Record<string, unknown> = {}
    for (const line of body.split('\n').slice(1, -2)) {
      const [key, ...rest] = line.split(': ')
      if (key !== undefined && rest.length > 0)
        parsed[key] = JSON.parse(rest.join(': '))
    }
    expect(parsed['title']).toBe(source.title)
    expect(ClipMetadataSchema.safeParse({ ...source }).success).toBe(true)
  })
})
