import { TOOL_VERSION } from '../../cli/tool-version.ts'
import type { ClipMetadata } from '../../clips/clip-metadata.ts'
import type { BuildClipMetadataInput } from './build-clip-metadata-input.ts'
import { countWords } from './count-words.ts'
import { sha256Hex } from './sha256-hex.ts'

/** Fill the clip metadata for a captured article, from either lane.
 *
 * The extraction fields are passed in rather than fixed here. The harvest
 * always answers `article` with `site_extractor: true` - the honest pair, since
 * its body comes from Medium's own Apollo state rather than a generic DOM
 * strategy - while the drain answers with whichever step of Defuddle's chain
 * won.
 *
 * `sensitivity` stays `public` for both, and for one reason that covers them
 * equally: every URL in either lane is a public web page, whether it arrived in
 * a newsletter, a reading list or a share sheet.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const buildClipMetadata = (
  input: BuildClipMetadataInput,
): ClipMetadata => ({
  schema_version: 1,
  clip_id: input.clipId,
  title: input.article.title,
  url: input.url,
  normalized_url: input.normalizedUrl,
  canonical_url: input.article.url === '' ? null : input.article.url,
  site: new URL(input.url).hostname,
  author: input.article.author,
  published: null,
  language: null,
  clipped_at: input.clippedAt,
  clipped_from: input.clippedFrom,
  extension_version: TOOL_VERSION,
  extractor: input.extractor,
  site_extractor: input.siteExtractor,
  extractor_version: null,
  snapshot_mode: input.snapshotMode,
  sensitivity: 'public',
  content_sha256: sha256Hex(input.article.body),
  source_html_sha256: sha256Hex(input.sourceHtml),
  asset_count: 0,
  asset_failures: [],
  note: input.note,
  tags: input.topic === '' ? [] : [input.topic],
  word_count: countWords(input.article.body),
})
