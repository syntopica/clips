import type { TriageTopicName } from './triage-topic-name.ts'
import type { TriagedArticle } from './triaged-article.ts'

/** The topics a triage run actually produced, alphabetical with `other` last.
 *
 * Read off the articles rather than the configuration, so writing a run needs
 * no instance in scope and a topic dropped from the list since still gets its
 * file. */
export const triagedTopics = (
  articles: readonly TriagedArticle[],
): TriageTopicName[] => {
  const topics = [...new Set(articles.map((article) => article.topic))]
  const named = topics.filter((topic) => topic !== 'other').toSorted()
  return topics.includes('other') ? [...named, 'other'] : named
}
