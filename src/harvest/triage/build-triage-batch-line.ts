import type { TriageEntry } from './triage-entry.ts'
import { urlTopicWords } from './url-topic-words.ts'

/** One TSV line, `<index><TAB><title><TAB><slug words>`.
 *
 * Tabs and newlines inside a title would break the format, so they collapse to
 * spaces. The third column exists because a digest sometimes renders the link
 * text as subscription boilerplate, leaving the title with no topic in it while
 * the URL slug still carries the headline - see `urlTopicWords`. */
export const buildTriageBatchLine = (entry: TriageEntry): string =>
  `${String(entry.index)}\t${entry.article.title.replaceAll(/[\t\n\r]/gu, ' ')}\t${urlTopicWords(entry.article.url)}`
