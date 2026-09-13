import { CLIP_ID } from './ingest-test-clip-id.ts'

export const clipMetadata = (sensitivity: string): string =>
  JSON.stringify({
    schema_version: 1,
    clip_id: CLIP_ID,
    title: 't',
    url: 'https://example.com/',
    normalized_url: 'https://example.com/',
    canonical_url: null,
    site: 'example.com',
    author: null,
    published: null,
    language: 'en',
    clipped_at: '2026-07-26T19:07:35Z',
    clipped_from: 'test',
    extension_version: '0.1.0',
    extractor: 'defuddle',
    extractor_version: '0.6.0',
    snapshot_mode: 'sanitized',
    sensitivity,
    content_sha256: 'a'.repeat(64),
    source_html_sha256: 'b'.repeat(64),
    asset_count: 0,
    asset_failures: [],
    note: '',
    tags: [],
    word_count: 10,
  })
