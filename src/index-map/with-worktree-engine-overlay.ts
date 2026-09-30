import { lstat, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { worktreeEngineOverlay } from './worktree-engine-overlay.ts'

/** Run `body` with the engine pin written into the worktree, and take it away
 * afterwards whatever happened. The file exists only while the builder runs,
 * so validation never sees it and the committer never stages it. A worktree
 * that already carries its own `syntopica.local.json` is left alone. */
export const withWorktreeEngineOverlay = async <T>(
  worktree: string,
  body: () => Promise<T>,
): Promise<T> => {
  const path = join(worktree, 'syntopica.local.json')
  if (await lstat(path).catch(() => null)) return body()
  await writeFile(path, `${JSON.stringify(worktreeEngineOverlay())}\n`)
  try {
    return await body()
  } finally {
    await rm(path, { force: true })
  }
}
