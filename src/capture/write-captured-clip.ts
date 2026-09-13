import { normalizeArticleUrl } from '../harvest/newsletter/normalize-article-url.ts'
import { buildClipMetadata } from '../harvest/promote/build-clip-metadata.ts'
import { newClipId } from '../harvest/promote/new-clip-id.ts'
import { writeClip } from '../harvest/promote/write-clip.ts'
import type { WriteCapturedClipInput } from './write-captured-clip-input.ts'

/** Write one drained capture into the clip store, with or without a body.
 *
 * A capture whose page could not be read still becomes a clip: `snapshot_mode:
 * 'omitted'`, an empty body and the reason in `note`. That is the owner's
 * choice over routing it to `needs-claude` or leaving it in the inbox, and it is
 * what stops a permanent failure from being retried forever. The URL, the note
 * and the capture's own timestamp survive, which is the irreducible value here -
 * a page citing such a clip can see its source has no captured text, as against
 * the thin clips, where a page rested on a source that silently had none.
 *
 * The title falls back to the URL rather than being left empty: it is what
 * `clipDirectoryName` slugs and what `clips status` prints, and a blank one
 * makes a body-less clip anonymous in exactly the listing meant to surface it.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const writeCapturedClip = (input: WriteCapturedClipInput): string => {
  const { capture, captured, clipsRepository, now } = input
  const note = [capture.note, captured.reason]
    .filter((part) => part !== null && part !== '')
    .join(' - ')
  return writeClip(
    clipsRepository,
    buildClipMetadata({
      clipId: newClipId(now),
      clippedFrom: capture.capture_source,
      url: capture.url,
      normalizedUrl: normalizeArticleUrl(capture.url),
      clippedAt: capture.captured_at,
      topic: '',
      article: captured.page ?? {
        title: capture.url,
        url: '',
        author: null,
        body: '',
      },
      sourceHtml: captured.html,
      note,
      // Meaningless on a body-less clip and there is no honest enum member for
      // "none": `snapshot_mode: 'omitted'` and `word_count: 0` are the fields
      // that say so, and widening the schema for a value nothing routes on
      // would be a change to every reader for the benefit of none.
      extractor: captured.page?.extractor ?? 'body',
      siteExtractor: captured.page?.siteExtractor ?? false,
      snapshotMode: captured.page === null ? 'omitted' : 'extracted',
    }),
    captured.page?.body ?? '',
    captured.html,
  )
}
