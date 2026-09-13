import { escapeMarkdownLinkText } from './escape-markdown-link-text.ts'
import type { TriagedArticle } from './triaged-article.ts'

/** One line of a triage section. Only `review` entries get a checkbox: those
 * ticks are the interface `clips harvest --promote` reads back, so a checkbox
 * anywhere else would invite a tick that nothing acts on. */
export const formatTriageEntry = (article: TriagedArticle): string => {
  const bullet = article.bucket === 'review' ? '- [ ] ' : '- '
  const title = escapeMarkdownLinkText(article.title)
  return `${bullet}[${title}](${article.url}) - ${article.reason}`
}
