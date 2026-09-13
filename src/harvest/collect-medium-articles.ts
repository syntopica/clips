import { collectSavedPosts } from './medium/collect-saved-posts.ts'
import { savedPostsAsArticles } from './medium/saved-posts-as-articles.ts'
import type { HarvestedArticle } from './newsletter/harvested-article.ts'

/** The reading-list sweep with its failure already handled. A signed-out
 * Chrome, an expired cookie or one of Cloudflare's transient 403s costs this
 * source and nothing else. */
export const collectMediumArticles = async (
  fallbackDate: string,
): Promise<HarvestedArticle[] | null> => {
  try {
    return savedPostsAsArticles(await collectSavedPosts(), fallbackDate)
  } catch (error) {
    process.stderr.write(
      `medium-list collector skipped: ${error instanceof Error ? error.message : String(error)}\n`,
    )
    return null
  }
}
