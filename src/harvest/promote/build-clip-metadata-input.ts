import type { ClipMetadata } from '../../clips/clip-metadata.ts'

/** Everything `buildClipMetadata` needs that it cannot derive itself. The
 * clock and the id generator are passed in rather than called inside, so the
 * function stays pure and its test does not depend on either.
 *
 * `article` is structural rather than `MediumArticle` because two lanes fill it
 * now: the harvest's Medium extraction and the drain's general one. They agree
 * on these four fields and differ in nothing else the metadata reads. */
export type BuildClipMetadataInput = {
  clipId: string
  /** What `clipped_from` records: which lane produced this capture. The harvest
   * passes its own constant; the drain passes the capture's `capture_source`,
   * so a URL shared from the phone keeps saying so after its body arrives
   * through a fetcher. */
  clippedFrom: string
  url: string
  normalizedUrl: string
  clippedAt: string
  topic: string
  article: {
    title: string
    url: string
    author: string | null
    body: string
  }
  sourceHtml: string
  /** What the capturer said about this page: the phone's optional note, and
   * the reason when nothing could be extracted. The harvest passes an empty
   * string; it captures from a checkbox list and nobody types there. */
  note: string
  /** Which extraction step produced the body, and whether it was a
   * site-specific one. The harvest always answers `article` and `true`: its
   * body comes from Medium's own Apollo state. */
  extractor: ClipMetadata['extractor']
  siteExtractor: boolean
  /** `omitted` when nothing could be extracted and the clip keeps only the URL.
   * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
  snapshotMode: ClipMetadata['snapshot_mode']
}
