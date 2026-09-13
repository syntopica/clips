import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ClipMetadataSchema } from '../../clips/clip-metadata-schema.ts'
import type { ClipMetadata } from '../../clips/clip-metadata.ts'
import { ClipStateSchema } from '../../clips/clip-state-schema.ts'
import { temporaryDir } from '../../testing/temporary-dir.ts'
import { writeClip } from './write-clip.ts'

/** Prefix of every temporary clips repository this file creates. */
const WRITE_PREFIX = 'clips-write-'
/** The captured source html handed to every write. */
const SOURCE_HTML = '<html></html>'

const metadata: ClipMetadata = {
  schema_version: 1,
  clip_id: '01KYNM2FHGCRDYJ1NZ57TXS2GR',
  title: 'Agent Memory',
  url: 'https://medium.com/@a/agent-memory-000000000001',
  normalized_url: 'https://medium.com/@a/agent-memory-000000000001',
  canonical_url: null,
  site: 'medium.com',
  author: 'A Writer',
  published: null,
  language: null,
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
  tags: ['ai-agents'],
  word_count: 3,
}

describe('writeClip', () => {
  it('writes the four files discoverClips expects', () => {
    const repository = temporaryDir(WRITE_PREFIX)
    const directory = writeClip(
      repository,
      metadata,
      '# Body\n\nSome words here',
      SOURCE_HTML,
    )

    expect(readdirSync(directory).toSorted()).toEqual([
      'index.md',
      'metadata.json',
      'source.html',
      'state.json',
    ])
  })

  it('files the clip under pending, partitioned by capture year and month', () => {
    const repository = temporaryDir(WRITE_PREFIX)
    const directory = writeClip(repository, metadata, 'body', SOURCE_HTML)

    expect(directory).toContain(join('clips', 'pending', '2026', '07'))
    expect(directory).toContain('2026-07-29-medium-com-agent-memory-01kynm2f')
  })

  it('writes metadata the reader schema accepts', () => {
    const repository = temporaryDir(WRITE_PREFIX)
    const directory = writeClip(repository, metadata, 'body', SOURCE_HTML)
    const written: unknown = JSON.parse(
      readFileSync(join(directory, 'metadata.json'), 'utf8'),
    )

    expect(ClipMetadataSchema.safeParse(written).success).toBe(true)
  })

  it('writes a pending state the reader schema accepts', () => {
    const repository = temporaryDir(WRITE_PREFIX)
    const directory = writeClip(repository, metadata, 'body', SOURCE_HTML)
    const state: unknown = JSON.parse(
      readFileSync(join(directory, 'state.json'), 'utf8'),
    )

    expect(ClipStateSchema.safeParse(state).success).toBe(true)
  })

  it('puts the frontmatter above the body in index.md', () => {
    const repository = temporaryDir(WRITE_PREFIX)
    const directory = writeClip(
      repository,
      metadata,
      '# Heading\n\ntext',
      SOURCE_HTML,
    )
    const index = readFileSync(join(directory, 'index.md'), 'utf8')

    expect(index.startsWith('---\n')).toBe(true)
    expect(index.indexOf('---\n', 4)).toBeLessThan(index.indexOf('# Heading'))
  })
})
