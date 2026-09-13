import type { GradedPage } from './graded-page.ts'

/** The "N/M cited sources on disk" fragment shared by every non-exempt,
 * non-failed report line, with the uncheckable count appended when there is
 * one. */
export const formatGradeEvidenceLine = (graded: GradedPage): string => {
  const uncheckable = graded.result?.uncheckable.length ?? 0
  return `${String(graded.evidenceClips)}/${String(graded.citedUrls)} cited sources on disk${uncheckable === 0 ? '' : `, ${String(uncheckable)} uncheckable`}`
}
