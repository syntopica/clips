import type { AuditFinding } from './audit-finding.ts'
import { collectPageFindings } from './collect-page-findings.ts'
import { pageInlineMaths } from './page-inline-maths.ts'
import { pageUnclosedMathsBlock } from './page-unclosed-maths-block.ts'

/** The maths convention `SCHEMA.md` settled on 2026-08-03, checked: `$$` blocks
 * are allowed, inline `$...$` is not, and a block must close.
 *
 * One pass over the pages answers both questions, because they read the same
 * delimiters and differ only in what they count. Neither costs a model or a
 * network call, which is what makes them runnable on every batch. */
export const findMathsConventionBreaches = async (
  brainRepository: string,
): Promise<AuditFinding[]> => {
  return collectPageFindings(brainRepository, (text, page) => {
    const findings: AuditFinding[] = []
    for (const offence of pageInlineMaths(text))
      findings.push({ check: 'inline-maths', subject: page, detail: offence })
    const delimiters = pageUnclosedMathsBlock(text)
    if (delimiters !== null)
      findings.push({
        check: 'unclosed-maths-block',
        subject: page,
        detail: `${String(delimiters)} \`$$\` delimiter${delimiters === 1 ? '' : 's'}, so one block never closes`,
      })
    return findings
  })
}
