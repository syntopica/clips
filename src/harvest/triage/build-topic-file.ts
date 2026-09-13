import { formatGoneEntry } from './format-gone-entry.ts'
import { formatTriageEntry } from './format-triage-entry.ts'
import { triageBucketHeading } from './triage-bucket-heading.ts'
import { TRIAGE_BUCKET_ORDER } from './triage-bucket-order.ts'
import type { TriageTopicName } from './triage-topic-name.ts'
import type { TriagedArticle } from './triaged-article.ts'

/** Render one topic's triage file: a count line, then a section per non-empty
 * bucket, newest article first. Empty buckets are omitted rather than printed
 * as a zero, so the file only shows what there is to act on. An article in
 * `goneUrls` keeps its `[gone-410]` marker across the rewrite. */
export const buildTopicFile = (
  topic: TriageTopicName,
  date: string,
  articles: readonly TriagedArticle[],
  goneUrls: ReadonlySet<string> = new Set(),
): string => {
  const counted = TRIAGE_BUCKET_ORDER.map((bucket) => ({
    bucket,
    rows: articles
      .filter((article) => article.bucket === bucket)
      .toSorted((left, right) => right.firstSeen.localeCompare(left.firstSeen)),
  }))
  const summary = counted
    .map(({ bucket, rows }) => `${String(rows.length)} ${bucket}`)
    .join(', ')
  const lines = [
    `# ${topic} - newsletter triage ${date}`,
    '',
    `${String(articles.length)} articles: ${summary}.`,
    '',
  ]
  for (const { bucket, rows } of counted) {
    if (rows.length === 0) continue
    lines.push(`## ${triageBucketHeading(bucket)} (${String(rows.length)})`, '')
    if (bucket === 'review') {
      lines.push(
        'Tick what you want ingested, then run `clips harvest --promote`.',
        '',
      )
    }
    lines.push(
      ...rows.map((row) =>
        goneUrls.has(row.url) ? formatGoneEntry(row) : formatTriageEntry(row),
      ),
      '',
    )
  }
  return lines.join('\n')
}
