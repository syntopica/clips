import { escapeMarkdownLinkText } from './escape-markdown-link-text.ts'
import type { TriagedArticle } from './triaged-article.ts'

/** One triage line for an article known deleted upstream. The `[gone-410]`
 * prefix is what `parseTickedArticles` and `parseAllArticles` skip, so
 * rendering it here is what keeps promote from retrying a dead URL after a
 * harvest re-run. No checkbox: a tick on a dead article is not actionable. */
export const formatGoneEntry = (article: TriagedArticle): string =>
  `- [gone-410] [${escapeMarkdownLinkText(article.title)}](${article.url}) - ${article.reason}`
