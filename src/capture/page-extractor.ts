/** Which step of the extraction chain produced a page's body.
 *
 * The same union `ClipMetadataSchema` accepts and the same one the clipper's
 * `extractContent` reports, minus `selection` - there is no selection to clip
 * when the capture is a URL shared from a phone. Keeping the names identical is
 * what lets a clip's provenance read the same whichever lane produced it. */
export type PageExtractor =
  'defuddle' | 'article' | 'main' | 'body' | 'innertext'
