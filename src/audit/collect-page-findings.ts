import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { wikiDirectory } from '../layout/wiki-directory.ts'
import type { AuditFinding } from './audit-finding.ts'
import { wikiPages } from './wiki-pages.ts'

/** Collects findings from readable wiki pages in traversal order. */
export const collectPageFindings = async (
  brainRepository: string,
  inspect: (text: string, page: string) => AuditFinding[],
): Promise<AuditFinding[]> => {
  const findings: AuditFinding[] = []
  const root = wikiDirectory(brainRepository)
  for (const page of await wikiPages(brainRepository)) {
    const text = await readFile(join(root, page), 'utf8').catch(() => null)
    if (text !== null) findings.push(...inspect(text, page))
  }
  return findings
}
