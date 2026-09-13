import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pageSourceUrls } from '../grade/page-source-urls.ts'
import { resolveLocalSource } from '../grade/resolve-local-source.ts'
import type { AuditFinding } from './audit-finding.ts'
import { pageSources } from './page-sources.ts'
import { wikiPages } from './wiki-pages.ts'

/** Sources a page lists that no reader of the field can open.
 *
 * Three readers walk `sources:` - `pageSources` for the rank and the marker
 * index, `pageSourceUrls` for the evidence clips, `pageSourceFiles` for what is
 * on disk - and each carries its own idea of what an entry looks like. When
 * they disagree, the entry is not reported missing: it is simply absent from
 * one reader's result, and every count downstream is quietly short.
 *
 * That has now happened four times in a month, and each time the evidence was
 * on disk while the reader could not see it: `vexa://` identities matched by no
 * scheme, X-thread urls with no resolver, one Medium post under two spellings,
 * and an annotated entry killed by a `$` anchor. The last is the one this check
 * exists for, because it was already fixed once - `pageSources` learned to read
 * up to the first token on 2026-08-08 after an ingest was refused for citing
 * the source it had just appended - and the fix was not carried to the other
 * two readers, so the same page went on losing the same two X threads for
 * another sixteen days. A grade then read that loss as the page overreaching
 * and it was triaged twice as possibly real.
 *
 * So the finding is the disagreement itself, which needs no model and no
 * network: an entry `pageSources` accepts and `pageSourceUrls` and
 * `resolveLocalSource` both refuse.
 *
 * Scoped to entries that **claim to be in this repository** - a relative path
 * whose first segment is a real directory at the root. Everything else the
 * disagreement catches is not a defect: a `projects/` page citing an absolute
 * path into the repository it describes is the declared-exempt class SCHEMA
 * names, and a bare domain or address is a source with a rank and nothing to
 * open. Unscoped it reported 86 of 118 pages, which is the always-fires shape
 * this repo has switched a check off for once; scoped it reports 4, and all
 * four are real. Two of them are `business/aeat-carta-pago-caixabank.md`,
 * where the file is on disk under a name containing spaces and every reader of
 * the field truncates the entry at the first one - so the page cites two AEAT
 * payment receipts and the graders see none. */
export const findUnreadableSources = async (
  brainRepository: string,
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  const roots = new Set(
    (await readdir(brainRepository, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  )
  for (const page of await wikiPages(brainRepository)) {
    const text = await readFile(join(brainRepository, page), 'utf8').catch(
      () => null,
    )
    if (text === null) continue
    const urls = new Set(pageSourceUrls(text))
    const unreadable = pageSources(text).filter(
      (entry) =>
        roots.has(entry.split('/')[0] ?? '') &&
        !urls.has(entry) &&
        resolveLocalSource(brainRepository, entry) === null,
    )
    if (unreadable.length === 0) continue
    findings.push({
      check: 'unreadable-source',
      subject: page,
      detail: `${unreadable.join(', ')} listed in sources and opened by no reader`,
    })
  }
  return findings
}
