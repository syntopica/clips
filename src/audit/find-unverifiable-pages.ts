import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { evidenceClipPaths } from '../grade/evidence-clip-paths.ts'
import { pageSourceFiles } from '../grade/page-source-files.ts'
import { pageSourceUrls } from '../grade/page-source-urls.ts'
import { pageVerificationExempt } from '../grade/page-verification-exempt.ts'
import type { AuditFinding } from './audit-finding.ts'
import { pagesWithText } from './pages-with-text.ts'
import { xThreadSourcePath } from './x-thread-source-path.ts'

/** Pages no check in this repository can reach, which have not said so.
 *
 * `clips grade` grades a page against the clips and local files it cites, and
 * the source-drift and unresolved-citation checks above need a citation to
 * work from. A page with no evidence on disk falls outside all of them - and
 * until 2026-08-03 it fell out silently, which is the failure this check
 * exists to end: the pages holding live credentials and fiscal figures, where
 * being wrong costs the most, were the ones nothing looked at.
 *
 * The answer is not to grade them. Most describe something that maintains
 * itself elsewhere - a repository, a bank, a tax authority - so there is
 * nothing here for a claim to be graded against, and a grader pointed at one
 * reports forever. The answer is that the exemption is declared, on the page,
 * so the set is enumerable. `verification: exempt` clears the finding; nothing
 * else does, and adding a page without either evidence or a marker fails this
 * check on the next batch rather than disappearing into the silence. */
export const findUnverifiablePages = async (
  brainRepository: string,
  clips: readonly (Clip | ThinClip)[],
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  for (const [page, text] of await pagesWithText(brainRepository)) {
    if (pageVerificationExempt(text)) continue
    const urls = pageSourceUrls(text)
    const evidence = [
      ...evidenceClipPaths(urls, clips),
      ...pageSourceFiles(brainRepository, text),
      ...urls.flatMap((url) => {
        const thread = xThreadSourcePath(brainRepository, url)
        return thread === null ? [] : [thread]
      }),
    ]
    if (evidence.length > 0) continue
    findings.push({
      check: 'unverifiable-page',
      subject: page,
      detail:
        urls.length === 0
          ? 'cites no evidence on disk and claims no exemption; add sources or `verification: exempt`'
          : `cites ${String(urls.length)} url(s) with no clip on disk and claims no exemption; add \`verification: exempt\``,
    })
  }
  return findings
}
