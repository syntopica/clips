import type { ClaimRef } from '../citations/claim-ref.ts'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import type { AuditFinding } from './audit-finding.ts'
import { normalizedQuote } from './normalized-quote.ts'
import { pageQuotedClaims } from './page-quoted-claims.ts'
import { pagesWithText } from './pages-with-text.ts'
import { sourceTextForRef } from './source-text-for-ref.ts'

/** Quotations whose source does not contain them.
 *
 * The cheapest verification in the 2026-08-02 survey - `green-dalii` runs it
 * with no model, no network and no false positives, because the question is
 * mechanical: this page says a source contains these words, and either it does
 * or it does not. `clips grade` asks a model the same thing about every
 * sentence at a codex run per page; this asks it of the sentences where being
 * wrong is a misquote rather than a paraphrase, for free, on every batch.
 *
 * It waited for the claim-level markers and could not have run before them.
 * Without a marker a quotation names no source, so grounding it would mean
 * searching every source the page lists and reporting a miss only when all of
 * them lack it - which turns one page's evidence into a wiki-wide guess. The
 * marker is what gives the check somewhere to look.
 *
 * Silent on the wiki as it stands, like the two lint checks it joins: no
 * grandfathered page carries a marker, so no quotation on one is attributed and
 * none is read. The corpus is what it waits for now, not the design. */
export const findUngroundedQuotes = async (
  brainRepository: string,
  clips: readonly (Clip | ThinClip)[],
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  for (const [page, text] of await pagesWithText(brainRepository)) {
    const sources = new Map<ClaimRef, string | null>()
    for (const claim of pageQuotedClaims(text)) {
      if (!sources.has(claim.ref))
        sources.set(
          claim.ref,
          await sourceTextForRef(brainRepository, text, claim.ref, clips),
        )
      const source = sources.get(claim.ref) ?? null
      if (source === null) continue
      if (normalizedQuote(source).includes(normalizedQuote(claim.quote)))
        continue
      findings.push({
        check: 'ungrounded-quote',
        subject: page,
        detail: `[${claim.ref}] is quoted "${claim.quote.slice(0, 60)}" and the source does not contain it`,
      })
    }
  }
  return findings
}
