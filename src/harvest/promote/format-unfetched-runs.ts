import type { UnfetchedRun } from './unfetched-run.ts'

/** The outstanding-ticks block `clips status` prints under the clip list.
 *
 * Silent when nothing is outstanding, so the common case costs no lines. The
 * command to run is spelled out per run because that is the whole point: the
 * gap this closes was five articles nobody knew to re-promote. */
export const formatUnfetchedRuns = (runs: readonly UnfetchedRun[]): string => {
  if (runs.length === 0) return ''
  const lines = ['', 'ticked but never clipped:']
  for (const run of runs) {
    lines.push(
      `  ${run.date}  ${String(run.articles.length)} article(s) - clips harvest --promote --date ${run.date}`,
    )
    for (const article of run.articles)
      lines.push(`    ${article.topic}  ${article.url}`)
  }
  return `${lines.join('\n')}\n`
}
