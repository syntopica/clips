import { printCapturedMediumArticle } from './print-captured-medium-article.ts'

/** `node capture-medium-article-cli.ts <url>` - the extracted article and its
 * source HTML as JSON on stdout.
 *
 * It exists because the Medium session lives in TypeScript - Chrome's cookie
 * store is decrypted by `readMediumCookies` and the Apollo-state extractor is
 * 900 lines beside it - while the passes that need one article are Python
 * one-offs under `tools/capture/`. Porting either would be a second
 * implementation of something already tested here. */
process.exitCode = await printCapturedMediumArticle(process.argv[2])
