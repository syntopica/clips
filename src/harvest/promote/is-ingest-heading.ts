/** Whether a line opens the `Ingest` section of a triage file.
 *
 * Matched on the heading `buildTopicFile` writes - `## Ingest (28)` - and
 * anchored so `## Ingested` or a body line quoting the word cannot pass. */
export const isIngestHeading = (line: string): boolean =>
  /^##\s+Ingest\s*(?:\(\d+\)\s*)?$/u.test(line)
