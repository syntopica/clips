import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { indexMapScript } from './index-map-script.ts'
import { withWorktreeEngineOverlay } from './with-worktree-engine-overlay.ts'

/** Regenerates the index inside the worktree from every page's `summary:`
 * frontmatter. Returns why it could not, or null when the map is written.
 *
 * This is a trusted step, like the ledger: the synthesizer is forbidden from
 * touching the index at all, so the root map is derived rather than amended by
 * a model. Deriving it is what removes the drift that had `projects/legacy-site`
 * missing from the map until 2026-08-02.
 *
 * It runs before the review gate, not after. That ordering is the whole reason
 * a Python dependency in the publish path is acceptable: a missing
 * interpreter or a script error fails the clip while the brain is still
 * untouched, instead of after a human approved a diff. It also means the
 * reviewer sees the index line being added, which they would not if the map
 * were generated during publication.
 *
 * The interpreter is the brain engine's own environment, through `uv run`,
 * never a bare `python3`: under launchd's PATH that resolved to the system
 * Python 3.9, the builder (which needs 3.12) died at import on `typing.Never`,
 * and from 2026-10-09 every unattended clip escalated as INDEX_MAP_FAILED.
 * `--no-sync` because the builder has no dependencies and a publish step must
 * not touch the network.
 *
 * `-B` keeps the interpreter from writing `__pycache__` beside the engine's
 * modules on every run.
 *
 * `--data .` names the worktree as the data directory: the generator derives
 * nothing from its own location, so without the flag it would walk upward out
 * of the worktree and index the wrong instance. The worktree's configuration
 * names its engines relative to a checkout it is not in, which is what
 * `withWorktreeEngineOverlay` pins. */
export const generateIndexMap = async (
  worktree: string,
): Promise<string | null> => {
  const execFileAsync = promisify(execFile)
  const script = indexMapScript()
  try {
    await withWorktreeEngineOverlay(worktree, async () =>
      execFileAsync(
        'uv',
        [
          'run',
          '--no-sync',
          '--project',
          currentSyntopicaConfig().brainPath,
          'python',
          '-B',
          script,
          '--data',
          '.',
        ],
        { cwd: worktree, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
      ),
    )
    return null
  } catch (error) {
    const failure = error as { stderr?: string; message?: string }
    const detail = failure.stderr?.trim() || failure.message || 'unknown error'
    return `${script} failed: ${detail}`
  }
}
