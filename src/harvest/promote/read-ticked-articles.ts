import { parseAllArticles } from './parse-all-articles.ts'
import { readTriageDirectory } from './read-triage-directory.ts'
import type { TickedArticle } from './ticked-article.ts'

/** Read one dated triage run, or report why it could not be read and return
 * null. A missing run and an unreadable one are both the user's problem to fix,
 * so they end the command rather than degrading it to an empty batch. */
export const readTickedArticles = (
  directory: string,
  captureAll: boolean,
): TickedArticle[] | null => {
  try {
    return readTriageDirectory(
      directory,
      captureAll ? parseAllArticles : undefined,
    )
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return null
  }
}
