import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { temporaryDir } from '../testing/temporary-dir.ts'

/** Writes each page body at its path under a fresh temp directory shaped like
 * a brain wiki checkout, and returns the directory root. Shared by the audit
 * checks' tests, which each need a throwaway wiki to point a finder at. */
export const brainWith = (pages: Record<string, string>): string => {
  const root = temporaryDir('clips-audit-')
  for (const [path, body] of Object.entries(pages)) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    writeFileSync(join(root, path), body)
  }
  return root
}
