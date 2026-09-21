import { z } from 'zod'
import { ULID_PATTERN } from './ulid-pattern.ts'

/** Copied from the clipper's src/shared/clip-metadata-schema.ts, not shared
 * as a package: SPEC:192-197. One deliberate divergence - site_extractor is
 * optional here. The extension requires it, but three of the seven captured
 * clips predate the field, and schema_version is 1 for all of them, so the
 * version gate cannot see the drift. */
export const ClipMetadataSchema = z.object({
  schema_version: z.literal(1),
  clip_id: z.string().regex(ULID_PATTERN),
  title: z.string(),
  url: z.url(),
  normalized_url: z.url(),
  canonical_url: z.url().nullable(),
  site: z.string(),
  author: z.string().nullable(),
  published: z.string().nullable(),
  language: z.string().nullable(),
  clipped_at: z.string(),
  clipped_from: z.string(),
  extension_version: z.string(),
  extractor: z.enum([
    'selection',
    'defuddle',
    'readability',
    'article',
    'main',
    'body',
    'innertext',
  ]),
  site_extractor: z.boolean().optional(),
  extractor_version: z.string().nullable(),
  snapshot_mode: z.enum(['extracted', 'sanitized', 'full-page', 'omitted']),
  sensitivity: z.enum(['public', 'private', 'restricted']),
  content_sha256: z.string().length(64),
  source_html_sha256: z.string().length(64),
  asset_count: z.number().int().nonnegative(),
  asset_failures: z.array(z.string()),
  note: z.string(),
  tags: z.array(z.string()),
  word_count: z.number().int().nonnegative(),
})
