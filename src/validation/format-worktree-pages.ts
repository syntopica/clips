import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { prettierText } from '../format/prettier-text.ts'

/** Rewrites every markdown page the synthesis touched in the repository's own
 * prettier style, so formatting is part of what "validated" means rather than
 * a runbook step for hand ingests. Each of the 15 clips published on
 * 2026-08-02 landed on origin/main with prettier violations in its page and in
 * its ledger, and left `pnpm run check` red until a manual sweep of 23 files.
 *
 * Runs after the per-change checks, never before: those are what reject a
 * symlink, and writing formatted text back through one would reach outside the
 * worktree. Runs before the limits, so the changed-line counts and the diff the
 * reviewer approves are the ones that get committed.
 *
 * Returns why formatting failed, or null when every page is formatted - a page
 * prettier cannot parse is a validation failure, not a crashed run. */
export const formatWorktreePages = async (
  brainRepository: string,
  worktree: string,
  paths: readonly string[],
): Promise<string | null> => {
  for (const path of paths) {
    const absolute = join(worktree, path)
    const text = await readFile(absolute, 'utf8')
    let formatted: string
    try {
      formatted = await prettierText(brainRepository, path, text)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      return `${path}: prettier could not format it (${detail})`
    }
    if (formatted !== text) await writeFile(absolute, formatted)
  }
  return null
}
