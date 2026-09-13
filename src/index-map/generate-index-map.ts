import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { INDEX_MAP_SCRIPT } from './index-map-script.ts'

/** Regenerates `index.md` inside the worktree from every page's `summary:`
 * frontmatter. Returns why it could not, or null when the map is written.
 *
 * This is a trusted step, like the ledger: the synthesizer is forbidden from
 * touching `index.md` at all, so the root map is derived rather than amended by
 * a model. Deriving it is what removes the drift that had `projects/legacy-site`
 * missing from the map until 2026-08-02.
 *
 * It runs before the review gate, not after. That ordering is the whole reason
 * a `python3` dependency in the publish path is acceptable: a missing
 * interpreter or a script error fails the clip while the brain is still
 * untouched, instead of after a human approved a diff. It also means the
 * reviewer sees the index line being added, which they would not if the map
 * were generated during publication.
 *
 * `-B` keeps the interpreter from writing `__pycache__` next to the script:
 * since 2026-09-13 `build.py` imports sibling modules, and the bytecode cache
 * that import leaves behind is an untracked file inside the worktree, which is
 * exactly what makes `git worktree remove` refuse and keep the branch after a
 * publication that succeeded.
 *
 * `--data .` names the worktree as the data directory. Since 2026-09-13 the
 * generator no longer derives the wiki root from its own source location, so
 * without the flag it would walk upward out of the worktree and index the
 * wrong instance. */
export const generateIndexMap = async (
  worktree: string,
): Promise<string | null> => {
  const execFileAsync = promisify(execFile)
  try {
    await execFileAsync('python3', ['-B', INDEX_MAP_SCRIPT, '--data', '.'], {
      cwd: worktree,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    })
    return null
  } catch (error) {
    const failure = error as { stderr?: string; message?: string }
    const detail = failure.stderr?.trim() || failure.message || 'unknown error'
    return `${INDEX_MAP_SCRIPT} failed: ${detail}`
  }
}
