import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Clip } from '../clips/clip.ts'
import type { ThinClip } from '../clips/thin-clip.ts'
import { exemptPage } from './exempt-page.ts'
import { gradeRunFailure } from './grade-run-failure.ts'
import type { GradeRunner } from './grade-runner.ts'
import { gradeVerdictFailure } from './grade-verdict-failure.ts'
import { gradeableEvidence } from './gradeable-evidence.ts'
import type { GradedPage } from './graded-page.ts'
import { pageEvidencePaths } from './page-evidence-paths.ts'
import { pageSourceFiles } from './page-source-files.ts'
import { pageSourceUrls } from './page-source-urls.ts'
import { pageVerificationExempt } from './page-verification-exempt.ts'
import { parseGradeOutput } from './parse-grade-output.ts'
import { sensitivePageRefusal } from './sensitive-page-refusal.ts'
import { ungradedPage } from './ungraded-page.ts'

/** Grade one page against the clips it cites. Every way this can come up short
 * - an unreadable page, a page citing nothing, a page whose sources are not in
 * the clip store, a codex run that failed or returned an unreadable message -
 * ends as a `failure` string rather than an exception, because the caller
 * grades a list of pages and one bad page must not lose the rest.
 *
 * A page declaring `verification: exempt` returns before any of that and costs
 * no model call. It is checked first, ahead of even the source read: the point
 * of the marker is that there is nothing to read.
 *
 * A page under a sensitive directory is refused ahead of even that, because
 * that check is about transmission rather than about grading and so must not
 * depend on the page being readable, on it citing anything, or on what its
 * frontmatter happens to say. Until 2026-09-11 nothing enforced the rule and
 * ten such pages were gradeable - which meant transmittable - including the
 * company credential table. The others were shielded only by carrying
 * `verification: exempt`, which is a statement about what can verify a page
 * and never was one about what may leave the machine. */
export const gradePage = async (
  brainRepository: string,
  page: string,
  clips: readonly (Clip | ThinClip)[],
  runner: GradeRunner,
): Promise<GradedPage> => {
  const refusal = sensitivePageRefusal(page)
  if (refusal !== null) return ungradedPage(page, refusal)

  const text = await readFile(join(brainRepository, page), 'utf8').catch(
    () => null,
  )
  if (text === null) return ungradedPage(page, 'page not found')
  if (pageVerificationExempt(text)) return exemptPage(page)

  const urls = pageSourceUrls(text)
  const localFiles = pageSourceFiles(brainRepository, text)
  if (urls.length === 0 && localFiles.length === 0)
    return ungradedPage(page, 'page cites no sources')

  const clipPaths = pageEvidencePaths(brainRepository, urls, localFiles, clips)
  const counted = {
    page,
    citedUrls: urls.length + localFiles.length,
    evidenceClips: clipPaths.length,
    exempt: false,
  }
  if (clipPaths.length === 0)
    return {
      ...counted,
      result: null,
      failure: `no evidence on disk for any of its ${String(urls.length + localFiles.length)} cited sources`,
    }

  const overBudget = await gradeableEvidence(
    clipPaths,
    runner.evidenceCeilingBytes,
  )
  if (overBudget !== null)
    return { ...counted, result: null, failure: overBudget }

  const run = await runner.run(
    brainRepository,
    join(brainRepository, page),
    clipPaths,
  )
  const result = parseGradeOutput(run.lastMessage)
  if (result === null)
    return { ...counted, result: null, failure: gradeRunFailure(run) }
  const unusable = gradeVerdictFailure(result)
  if (unusable !== null) return { ...counted, result: null, failure: unusable }
  return { ...counted, result, failure: null }
}
