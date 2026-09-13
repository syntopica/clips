import { existsSync } from 'node:fs'
import { findMathsConventionBreaches } from '../audit/find-maths-convention-breaches.ts'
import { findMissingLedgerPages } from '../audit/find-missing-ledger-pages.ts'
import { findOpenContradictions } from '../audit/find-open-contradictions.ts'
import { findSourceDrift } from '../audit/find-source-drift.ts'
import { findStalePages } from '../audit/find-stale-pages.ts'
import { findStaleVerifications } from '../audit/find-stale-verifications.ts'
import { findUncitedSources } from '../audit/find-uncited-sources.ts'
import { findUndatedSupersessions } from '../audit/find-undated-supersessions.ts'
import { findUngroundedQuotes } from '../audit/find-ungrounded-quotes.ts'
import { findUnreadableSources } from '../audit/find-unreadable-sources.ts'
import { findUnresolvedCitations } from '../audit/find-unresolved-citations.ts'
import { findUnresolvedClaimRefs } from '../audit/find-unresolved-claim-refs.ts'
import { findUnverifiablePages } from '../audit/find-unverifiable-pages.ts'
import { formatAuditReport } from '../audit/format-audit-report.ts'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { discoverClips } from '../clips/discover-clips.ts'

/** The integrity pass: twelve questions the wiki cannot answer about itself by
 * reading its own prose, all answered from data already on disk, with no model
 * and no network. Being free is the point - it is what makes this runnable on
 * every batch, where `clips grade` is not.
 *
 * The first three ask whether the evidence still holds. The next four ask
 * about the pages themselves - how long since anyone touched one, how long
 * since anyone checked one against what it describes, which pages no check can
 * reach at all, and what the wiki has declared it cannot reconcile - which is
 * the half no amount of source checking reaches, and the half a wiki written
 * partly from the owner's own knowledge needs most. The next asks
 * whether a page renders: maths written inline, or a `$$` block left open, is
 * markup that reads fine in the diff and breaks on the only surface that
 * displays these pages.
 *
 * The last three ride on the claim-level citation scheme, and all three are
 * silent today by design. Two are the lint: whether a marker resolves, and
 * whether a marked page cites every source it lists - never whether a claim
 * carries a marker at all, which would fire on all 110 grandfathered pages and
 * be switched off inside a batch. The third reads what a marker points at and
 * checks the page's quotations are in it, which is the only thing here that
 * verifies prose against a source without a model. Reporting nothing on a wiki
 * written before the scheme is the honest baseline, not a broken check.
 *
 * The twelfth asks the supersession question: a belief the wiki has replaced
 * lives on in the page's `## Contested` section, and one with no date on it
 * records nothing. Only the undated ones are reported - the section itself
 * grows forever by design, and a check whose output only grows is one the
 * reader stops opening.
 *
 * Read-only in both repositories, like the grader and for the same reason: a
 * pass that repairs its own findings stops being a check.
 *
 * One more check was built and removed the same day. "Pages last changed outside
 * the pipeline" is how other implementations protect curated prose from an
 * unattended overwrite; here it fired on 86 of 90 pages, because most of this
 * wiki predates `clips ingest` and was written by Claude in-session. A check
 * that always fires carries no information, and every diff here passes a human
 * reviewer anyway.
 *
 * Exit 2 when anything was found. A finding is something to read, not something
 * to fix automatically: a drifted source may be a better clip than the one the
 * page was written from, an unresolved citation may be a link that predates the
 * clip store entirely, and a ledger pointing at a moved page is history doing
 * its job - the pair is what tells a reader the two are the same work. */
export const audit = async (
  brainRepository: string,
  clipsRepository: string,
): Promise<number> => {
  try {
    if (!existsSync(clipsRepository)) {
      process.stderr.write(
        `${clipsRepository} does not exist; run \`clips pull\` first\n`,
      )
      return EXIT_CODE.fatalLocal
    }
    const clips = await discoverClips(clipsRepository)
    const findings = [
      ...(await findSourceDrift(brainRepository, clips)),
      ...(await findUnresolvedCitations(brainRepository, clips)),
      ...(await findMissingLedgerPages(brainRepository, clips)),
      ...(await findStalePages(brainRepository, new Date())),
      ...(await findStaleVerifications(brainRepository, new Date())),
      ...(await findUnverifiablePages(brainRepository, clips)),
      ...(await findOpenContradictions(brainRepository)),
      ...(await findMathsConventionBreaches(brainRepository)),
      ...(await findUnresolvedClaimRefs(brainRepository)),
      ...(await findUncitedSources(brainRepository)),
      ...(await findUnreadableSources(brainRepository)),
      ...(await findUngroundedQuotes(brainRepository, clips)),
      ...(await findUndatedSupersessions(brainRepository)),
    ]
    process.stdout.write(formatAuditReport(findings))
    process.stdout.write(`\n${String(findings.length)} findings\n`)
    return findings.length === 0 ? EXIT_CODE.success : EXIT_CODE.clipsStopped
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return EXIT_CODE.fatalLocal
  }
}
