import { countUnclassified } from './triage/count-unclassified.ts'
import type { TriagedArticle } from './triage/triaged-article.ts'

/** Say whether a written triage run actually covers what it claims to, and
 * return true when it does.
 *
 * A dead classifier and a cautious one produce the same review bucket, and a
 * run missing a collector looks exactly like a quiet day. Nothing is lost in
 * either case - the articles are on disk and rerunning redoes the work - but
 * reporting success over a run that examined nothing would be a lie. */
export const reportTriageGaps = (
  triaged: readonly TriagedArticle[],
  skippedCollectors: number,
): boolean => {
  const unclassified = countUnclassified(triaged)
  if (unclassified === triaged.length) {
    process.stderr.write(
      'the classifier returned nothing for any batch, so every article was filed under ' +
        'review unexamined; check `codex exec` (quota, auth) and rerun\n',
    )
    return false
  }
  if (unclassified > 0) {
    process.stderr.write(
      `${String(unclassified)} of ${String(triaged.length)} articles got no verdict ` +
        'and were filed under review unexamined\n',
    )
  }
  if (skippedCollectors > 0) {
    process.stderr.write(
      `${String(skippedCollectors)} collector(s) were skipped, so this triage does not cover everything\n`,
    )
    return false
  }
  return true
}
