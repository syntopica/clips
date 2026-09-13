import { extractPage } from '../../capture/extract-page.ts'
import { normalizeArticleUrl } from '../newsletter/normalize-article-url.ts'
import { buildClipMetadata } from './build-clip-metadata.ts'
import { captureAssets } from './capture-assets.ts'
import { newClipId } from './new-clip-id.ts'
import { parseBodyArticleUrl } from './parse-body-article-url.ts'
import type { PromoteArticleInput } from './promote-article-input.ts'
import { readVexaBodyArticle } from './read-vexa-body-article.ts'
import { writeClip } from './write-clip.ts'

/** Promote one body-content article: the email is the article, so nothing is
 * fetched - the newest matching body comes out of Vexa's local store, goes
 * through the same general extraction the drain uses, and the raw HTML becomes
 * `source.html`.
 *
 * `extractPage` rather than `digestHtmlToMarkdown`, measured on 2026-08-11:
 * the digest converter emits only anchors, which collapsed a 2,498-word
 * digest article to 95 words of link lines, while the Defuddle chain
 * returned all of it. Its JSDOM cost is affordable here where it was not in
 * the sweep - a promotion converts the handful of ticked bodies, not 1,872.
 * The extractor and site-extractor fields are whatever the chain reports,
 * exactly as the drain records them.
 *
 * The title is the subject, not the parsed one: email HTML rarely carries a
 * usable `<title>`, and the subject is what the owner ticked. Assets are
 * captured immediately, as everywhere in this lane - a newsletter's images rot
 * exactly like an article's.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const promoteBodyArticle = async (
  input: PromoteArticleInput,
): Promise<string> => {
  const identity = parseBodyArticleUrl(input.article.url)
  if (identity === null)
    throw new Error(`not a body-content identity: ${input.article.url}`)
  const message = readVexaBodyArticle(identity.sender, identity.slug)
  const page = extractPage(message.bodyHtml, input.article.url)
  if (page === null)
    throw new Error(
      `nothing in the ${identity.sender} message body reads as content`,
    )
  const metadata = buildClipMetadata({
    clipId: newClipId(input.now),
    clippedFrom: input.clippedFrom,
    extractor: page.extractor,
    siteExtractor: page.siteExtractor,
    snapshotMode: 'extracted',
    note: '',
    url: input.article.url,
    normalizedUrl: normalizeArticleUrl(input.article.url),
    clippedAt: input.now.toISOString(),
    topic: input.article.topic,
    article: {
      title: message.subject,
      url: '',
      author: page.author,
      body: page.body,
    },
    sourceHtml: message.bodyHtml,
  })
  const directory = writeClip(
    input.clipsRepository,
    metadata,
    page.body,
    message.bodyHtml,
  )
  await captureAssets(input.brainRepository, directory)
  return directory
}
