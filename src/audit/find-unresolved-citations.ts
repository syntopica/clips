import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { evidenceClipPaths } from '../grade/evidence-clip-paths.ts'
import { pageSourceUrls } from '../grade/page-source-urls.ts'
import type { AuditFinding } from './audit-finding.ts'
import { pagesWithText } from './pages-with-text.ts'
import { xThreadSourcePath } from './x-thread-source-path.ts'

/** Pages citing a url that no clip on disk carries.
 *
 * `clips grade` already reports this, but only for the pages it is pointed at
 * and only at the cost of a codex run each. The same shortfall is free to
 * compute for the whole wiki: a citation that resolves to nothing is a claim
 * whose evidence cannot be re-read, whether or not anyone is grading.
 *
 * A page citing no urls at all is not reported. Plenty of pages here are
 * written from the owner's own knowledge rather than from a clip, and demanding
 * a source of them would be a rule this wiki has never had.
 *
 * An X status url resolves against `sources/x/` thread files as well as
 * clips: the sweeps scrape threads to disk rather than through the clip
 * pipeline, and the grader already reads that directory as evidence. */
export const findUnresolvedCitations = async (
  brainRepository: string,
  clips: readonly (Clip | ThinClip)[],
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  for (const [page, text] of await pagesWithText(brainRepository)) {
    const urls = pageSourceUrls(text)
    if (urls.length === 0) continue
    // Per url, not by comparing counts. Counting the paths returned for the
    // whole list gets both answers wrong, and did: two urls that share a clip
    // - one Medium post cited in two spellings - return one path and read as a
    // shortfall, while a page with a genuinely missing source stays silent
    // whenever another of its urls happens to match two clips. On 2026-08-04
    // the count reported `llm-wiki 1 of 43`, where every url resolves, and said
    // nothing about the two pages that really were short.
    const unresolved = urls.filter(
      (url) =>
        evidenceClipPaths([url], clips).length === 0 &&
        xThreadSourcePath(brainRepository, url) === null,
    )
    if (unresolved.length === 0) continue
    findings.push({
      check: 'unresolved-citation',
      subject: page,
      detail: `${String(unresolved.length)} of ${String(urls.length)} cited urls have no clip on disk: ${unresolved.join(', ')}`,
    })
  }
  return findings
}
