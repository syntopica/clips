import { describe, expect, it } from 'vitest'
import { ClipMetadataSchema } from './clip-metadata-schema.ts'

const legacy = {
  schema_version: 1,
  clip_id: '01KYFX6NFRDVW03ZFJXQ6W1VVG',
  title: 'GitHub - mozilla/readability',
  url: 'https://github.com/mozilla/readability',
  normalized_url: 'https://github.com/mozilla/readability',
  canonical_url: null,
  site: 'github.com',
  author: null,
  published: null,
  language: 'en',
  clipped_at: '2026-07-26T19:07:35Z',
  clipped_from: 'cdp-harness',
  extension_version: '0.1.0',
  extractor: 'readability',
  extractor_version: '0.6.0',
  snapshot_mode: 'sanitized',
  sensitivity: 'public',
  content_sha256:
    '6553495f507535108675c98d01daf946423946351b85790baa696ce59c071b07',
  source_html_sha256:
    '282400115260839633f3128396120a9daf215832951330897f005d09aede49ca',
  asset_count: 0,
  asset_failures: [],
  note: '',
  tags: [],
  word_count: 1035,
}

describe('ClipMetadataSchema', () => {
  it('accepts a clip captured before site_extractor existed', () => {
    // Three of the seven real clips predate the field. A verbatim copy of the
    // extension's schema, where it is required, rejects them with a parse error
    // and no UNSUPPORTED_CLIP_SCHEMA code, because schema_version is still 1.
    expect(ClipMetadataSchema.parse(legacy).site_extractor).toBeUndefined()
  })

  it('accepts a clip that carries site_extractor', () => {
    const parsed = ClipMetadataSchema.parse({ ...legacy, site_extractor: true })
    expect(parsed.site_extractor).toBe(true)
  })

  it('rejects a content_sha256 that is not 64 characters', () => {
    expect(() =>
      ClipMetadataSchema.parse({ ...legacy, content_sha256: 'abc' }),
    ).toThrow()
  })

  it('rejects an extractor outside the enum', () => {
    expect(() =>
      ClipMetadataSchema.parse({ ...legacy, extractor: 'pending-refetch' }),
    ).toThrow()
  })

  it('rejects a clip_id that would escape the ledger directory', () => {
    // ledgerPath joins clip_id straight into a filesystem path, so anything
    // longer than 26 characters was accepted and traversal came with it. Nothing
    // in 2a writes to that path; plan 2c does.
    expect(() =>
      ClipMetadataSchema.parse({
        ...legacy,
        clip_id: '../../../../../etc/passwd0000000000',
      }),
    ).toThrow()
  })

  it('rejects the ULID letters Crockford base32 excludes', () => {
    expect(() =>
      ClipMetadataSchema.parse({ ...legacy, clip_id: 'I'.repeat(26) }),
    ).toThrow()
  })
})
