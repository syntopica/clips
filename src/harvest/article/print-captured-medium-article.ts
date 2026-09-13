import { captureMediumArticle } from './capture-medium-article.ts'

/** Fetch one Medium article and print it as JSON, returning the exit code.
 *
 * A fetch or extraction failure returns non-zero with the message on stderr, so
 * a caller sees a failed process rather than having to parse an error out of
 * the JSON it was expecting. */
export const printCapturedMediumArticle = async (
  url: string | undefined,
): Promise<number> => {
  if (url === undefined) {
    process.stderr.write('usage: capture-medium-article-cli.ts <url>\n')
    return 2
  }
  try {
    process.stdout.write(`${JSON.stringify(await captureMediumArticle(url))}\n`)
    return 0
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return 1
  }
}
