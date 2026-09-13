import type { HarvestedArticle } from './newsletter/harvested-article.ts'

/** Fold both collectors into one deduplicated list.
 *
 * An article the user saved on Medium and also received in a digest is one
 * article, not two, so it must be classified once and appear once. The saved
 * copy wins the title when both carry one, because a digest title is truncated
 * to the email's column width while the reading list gives the full string. */
export const mergeHarvestedArticles = (
  ...groups: readonly (readonly HarvestedArticle[])[]
): HarvestedArticle[] => {
  const byUrl = new Map<string, HarvestedArticle>()
  for (const group of groups) {
    for (const article of group) {
      const seen = byUrl.get(article.url)
      if (seen === undefined) {
        byUrl.set(article.url, { ...article })
        continue
      }
      seen.count += article.count
      if (article.title.length > seen.title.length) seen.title = article.title
      if (article.firstSeen < seen.firstSeen) seen.firstSeen = article.firstSeen
    }
  }
  return [...byUrl.values()].toSorted((left, right) =>
    right.firstSeen.localeCompare(left.firstSeen),
  )
}
