import { extractMediumArticle } from '../article/extract-medium-article.ts'
import { fetchMediumPage } from '../medium/fetch-medium-page.ts'
import { normalizeArticleUrl } from '../newsletter/normalize-article-url.ts'
import { buildClipMetadata } from './build-clip-metadata.ts'
import { captureAssets } from './capture-assets.ts'
import { isBodyArticleUrl } from './is-body-article-url.ts'
import { newClipId } from './new-clip-id.ts'
import type { PromoteArticleInput } from './promote-article-input.ts'
import { promoteBodyArticle } from './promote-body-article.ts'
import { writeClip } from './write-clip.ts'

/** Fetch one ticked article and write it into the clip store. A `vexa://`
 * identity routes to `promoteBodyArticle` first: the email is the article, so
 * there is nothing to fetch.
 *
 * The session cookies go along because a member-only article returns only its
 * intro without them - the whole reason this lane reuses Chrome's Medium
 * session. Custom-domain publications (towardsdeeplearning.com,
 * levelup.gitconnected.com) are Medium-hosted and carry the same Apollo state,
 * so one extractor covers effectively the whole harvest.
 *
 * Assets are fetched immediately after the clip is written, not in a later pass:
 * capturing late is what cost this archive ten articles to `410 Gone`, and the
 * same window applies to a page's images.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md
 * SPEC: docs/superpowers/specs/2026-07-30-capture-first-pipeline-design.md */
export const promoteArticle = async (
  input: PromoteArticleInput,
): Promise<string> => {
  if (isBodyArticleUrl(input.article.url)) return promoteBodyArticle(input)
  const html = await fetchMediumPage(input.article.url, input.cookies)
  const article = extractMediumArticle(html)
  const metadata = buildClipMetadata({
    clipId: newClipId(input.now),
    clippedFrom: input.clippedFrom,
    extractor: 'article',
    siteExtractor: true,
    snapshotMode: 'extracted',
    note: '',
    url: input.article.url,
    normalizedUrl: normalizeArticleUrl(input.article.url),
    clippedAt: input.now.toISOString(),
    topic: input.article.topic,
    article,
    sourceHtml: html,
  })
  const directory = writeClip(
    input.clipsRepository,
    metadata,
    article.body,
    html,
  )
  await captureAssets(input.brainRepository, directory)
  return directory
}
