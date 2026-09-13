import type { HarvestedArticle } from '../newsletter/harvested-article.ts'
import { buildTriageBatches } from './build-triage-batches.ts'
import { parseTriageVerdicts } from './parse-triage-verdicts.ts'
import { refineTriageVerdicts } from './refine-triage-verdicts.ts'
import type { TriageRunner } from './triage-runner.ts'
import type { TriageVerdict } from './triage-verdict.ts'
import type { TriagedArticle } from './triaged-article.ts'
import { UNCLASSIFIED_VERDICT } from './unclassified-verdict.ts'

/** Classify every harvested article in two stages: one bulk call per batch,
 * then a refinement pass over the verdicts the bulk model left in `review`. A
 * null refiner is the single-pass behaviour this had until 2026-08-02.
 *
 * Batches run sequentially rather than in parallel: this is the cheap stage by
 * design and nothing is waiting on it, whereas six concurrent model processes
 * would compete for the quota the ingest pipeline needs. An id outside the
 * article range is dropped rather than trusted - it is the shape a hallucinated
 * or injected verdict takes, and the article it would have overwritten falls
 * through to `review` instead.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const classifyArticles = async (
  articles: readonly HarvestedArticle[],
  runner: TriageRunner,
  refiner: TriageRunner | null,
): Promise<TriagedArticle[]> => {
  const verdicts = new Map<number, TriageVerdict>()
  for (const batch of buildTriageBatches(articles)) {
    for (const [id, verdict] of parseTriageVerdicts(await runner.run(batch))) {
      if (id >= 0 && id < articles.length) verdicts.set(id, verdict)
    }
  }
  const settled =
    refiner === null
      ? verdicts
      : await refineTriageVerdicts(articles, verdicts, refiner)
  return articles.map((article, index) => {
    const verdict = settled.get(index) ?? UNCLASSIFIED_VERDICT
    return {
      url: article.url,
      title: article.title,
      firstSeen: article.firstSeen,
      bucket: verdict.bucket,
      topic: verdict.topic,
      reason: verdict.reason,
    }
  })
}
