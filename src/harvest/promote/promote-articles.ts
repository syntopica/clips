import { promoteArticle } from './promote-article.ts'
import type { PromoteArticlesInput } from './promote-articles-input.ts'
import type { PromoteFailureAttempt } from './promote-failure-attempt.ts'

/** Fetch every article in the batch, counting what landed and returning what
 * did not.
 *
 * One article failing does not stop the rest: a paywalled page, a deleted post
 * or a rate limit costs that clip and is reported on stderr, while the others
 * land. The failures come back rather than only being printed, because stderr
 * is not a record: five of the 2026-08-08 batch's 79 ticked articles never
 * became clips and nothing on disk said so.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const promoteArticles = async (
  input: PromoteArticlesInput,
): Promise<{ written: number; failures: PromoteFailureAttempt[] }> => {
  let written = 0
  const failures: PromoteFailureAttempt[] = []
  for (const article of input.articles) {
    try {
      await promoteArticle({
        article,
        clippedFrom: input.clippedFrom,
        cookies: input.cookies,
        clipsRepository: input.clipsRepository,
        brainRepository: input.brainRepository,
        now: input.now,
      })
      written += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push({ article, error: message })
      process.stderr.write(`  failed ${article.url}: ${message}\n`)
    }
  }
  return { written, failures }
}
