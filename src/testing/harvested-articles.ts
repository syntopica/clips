import type { HarvestedArticle } from '../harvest/newsletter/harvested-article.ts'

/** Builds numbered articles for triage batch tests. */
export const harvestedArticles = (count: number): HarvestedArticle[] =>
  Array.from({ length: count }, (_unused, index) => ({
    url: `https://medium.com/@a/post-${String(index).padStart(12, '0')}`,
    title: `Title ${String(index)}`,
    firstSeen: '2026-07-28',
    sender: 'noreply@medium.com',
    count: 1,
  }))
