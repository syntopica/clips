import { countBucket } from './count-bucket.ts'
import { TRIAGE_TOPICS } from './triage-topic.ts'
import type { TriagedArticle } from './triaged-article.ts'

/** The README a triage run drops beside its topic files: what was harvested,
 * how much deduplication removed, and where to click next. The link count is
 * passed in rather than derived, because deduplication happens before
 * classification and the ratio is the number worth showing. */
export const buildTriageIndex = (
  date: string,
  emailCount: number,
  linkCount: number,
  articles: readonly TriagedArticle[],
): string => {
  const removed =
    linkCount === 0 ? 0 : Math.round(100 - (100 * articles.length) / linkCount)
  const lines = [
    `# Newsletter triage - ${date}`,
    '',
    `${String(articles.length)} unique articles from ${String(emailCount)} digest emails ` +
      `(${String(linkCount)} article links extracted, ${String(removed)}% removed by deduplication).`,
    '',
    '| Bucket | Count |',
    '| --- | --- |',
    `| Ingest | ${String(countBucket(articles, 'ingest'))} |`,
    `| Review | ${String(countBucket(articles, 'review'))} |`,
    `| Rejected | ${String(countBucket(articles, 'rejected'))} |`,
    '',
    '| Topic | Articles |',
    '| --- | --- |',
  ]
  for (const topic of TRIAGE_TOPICS) {
    const total = articles.filter((article) => article.topic === topic).length
    if (total > 0) lines.push(`| [${topic}](${topic}.md) | ${String(total)} |`)
  }
  lines.push(
    '',
    'Tick boxes in the Review sections, then run `clips harvest --promote`.',
    'Rejected entries are recorded, not deleted, so a wrong call is recoverable.',
    '',
  )
  return lines.join('\n')
}
