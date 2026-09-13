import type { CollectedDigestLinks } from './collected-digest-links.ts'
import { formatSilentSenders } from './format-silent-senders.ts'

/** What a harvest run prints. The deduplication ratio is the headline: it is
 * the number that says whether the expensive stages will see a small enough
 * set to be worth running at all. */
export const formatHarvestSummary = (
  date: string,
  collected: CollectedDigestLinks,
): string => {
  const { articles, emailCount, linkCount, senders } = collected
  const removed =
    linkCount === 0 ? 0 : Math.round(100 - (100 * articles.length) / linkCount)
  return (
    [
      `harvest ${date}`,
      `  emails scanned   ${String(emailCount)}`,
      `  article links    ${String(linkCount)}`,
      `  unique articles  ${String(articles.length)} (${String(removed)}% removed by deduplication)`,
      '',
    ].join('\n') + formatSilentSenders(senders)
  )
}
