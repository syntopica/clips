import type { HarvestedArticle } from '../newsletter/harvested-article.ts'
import { buildIndexedTriageBatches } from './build-indexed-triage-batches.ts'
import { parseTriageVerdicts } from './parse-triage-verdicts.ts'
import type { TriageRunner } from './triage-runner.ts'
import type { TriageVerdict } from './triage-verdict.ts'

/** A second, much smaller pass over what the bulk classifier was unsure about.
 *
 * The bulk model reads every title; the refiner reads only the ones that came
 * back `review` - the bucket the prompt tells the classifier to prefer whenever
 * it is unsure - plus anything the bulk pass failed to classify at all, which
 * arrives here as a missing verdict for the same reason. That is where a
 * stronger model changes the answer, and it is a fraction of the corpus, which
 * is the whole point: the expensive quota is spent on the uncertain tail rather
 * than on 1400 titles a cheap model already settled.
 *
 * A verdict for an index that was not in the uncertain set is dropped rather
 * than applied. It is the shape a hallucinated or injected id takes, and
 * accepting it would let the refiner overwrite a verdict nobody asked it to
 * revisit. */
export const refineTriageVerdicts = async (
  articles: readonly HarvestedArticle[],
  verdicts: Map<number, TriageVerdict>,
  refiner: TriageRunner,
): Promise<Map<number, TriageVerdict>> => {
  const uncertain = articles
    .map((article, index) => ({ index, article }))
    .filter(
      (entry) => (verdicts.get(entry.index)?.bucket ?? 'review') === 'review',
    )
  if (uncertain.length === 0) return verdicts
  process.stderr.write(
    `refining ${String(uncertain.length)} of ${String(articles.length)} verdicts\n`,
  )
  const eligible = new Set(uncertain.map((entry) => entry.index))
  const refined = new Map(verdicts)
  for (const batch of buildIndexedTriageBatches(uncertain)) {
    for (const [id, verdict] of parseTriageVerdicts(await refiner.run(batch))) {
      if (eligible.has(id)) refined.set(id, verdict)
    }
  }
  return refined
}
