import type { TickedArticle } from './ticked-article.ts'

/** What `--promote` prints: what it found, grouped by topic so the user can
 * see their own ticks reflected back before anything is fetched. */
export const formatPromotionSummary = (
  directory: string,
  ticked: readonly TickedArticle[],
): string => {
  const byTopic = new Map<string, number>()
  for (const article of ticked) {
    byTopic.set(article.topic, (byTopic.get(article.topic) ?? 0) + 1)
  }
  const lines = [
    `promote ${directory}`,
    `  ticked articles  ${String(ticked.length)}`,
  ]
  for (const [topic, count] of [...byTopic].toSorted(([left], [right]) =>
    left.localeCompare(right),
  )) {
    lines.push(`    ${topic.padEnd(16)} ${String(count)}`)
  }
  lines.push('')
  return lines.join('\n')
}
