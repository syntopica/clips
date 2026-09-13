import { collectMediumArticles } from './collect-medium-articles.ts'
import { collectNewsletterArticles } from './collect-newsletter-articles.ts'
import { EMPTY_DIGEST_LINKS } from './empty-digest-links.ts'
import type { HarvestedRun } from './harvested-run.ts'
import { mergeHarvestedArticles } from './merge-harvested-articles.ts'
import { wantsSource } from './wants-source.ts'

/** Sweep the requested collectors and fold them into one deduplicated run.
 *
 * Neither collector throws - each reports its own failure and returns null - so
 * a source that is down costs its half of the run and the counts say so. */
export const collectHarvest = async (
  source: string | null,
  date: string,
  since: string,
): Promise<HarvestedRun> => {
  const wantsNewsletter = wantsSource(source, 'newsletter')
  const digests = wantsNewsletter ? collectNewsletterArticles(since) : null
  const saved = wantsSource(source, 'medium-list')
    ? await collectMediumArticles(date)
    : null
  const savedArticles = saved ?? []
  const digested = digests ?? EMPTY_DIGEST_LINKS
  return {
    articles: mergeHarvestedArticles(digested.articles, savedArticles),
    emailCount: digested.emailCount,
    linkCount: digested.linkCount + savedArticles.length,
    newsletterSwept: wantsNewsletter && digests !== null,
    savedCount: savedArticles.length,
    senders: digested.senders,
    skipped:
      (wantsNewsletter && digests === null ? 1 : 0) +
      (wantsSource(source, 'medium-list') && saved === null ? 1 : 0),
  }
}
