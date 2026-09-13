import { lstat, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PageTextResult } from './page-text-result.ts'
import { SYNTHESIS_LIMITS } from './synthesis-limits.ts'

/** The decoded body of a file the synthesizer wants committed, or why the file
 * on disk disqualifies itself. `lstat` (not `stat`) so a symlink is seen as
 * itself rather than followed - a symlink pointing outside the repository must
 * never be committed. */
export const readPageText = async (
  worktree: string,
  path: string,
): Promise<PageTextResult> => {
  const absolute = join(worktree, path)
  const stats = await lstat(absolute)
  if (stats.isSymbolicLink()) return { ok: false, failure: 'a symlink' }
  if (!stats.isFile()) return { ok: false, failure: 'not a regular file' }
  if ((stats.mode & 0o111) !== 0)
    return { ok: false, failure: 'executable bit set' }
  if (stats.size > SYNTHESIS_LIMITS.pageBytes) {
    return {
      ok: false,
      failure: `larger than ${String(SYNTHESIS_LIMITS.pageBytes)} bytes`,
    }
  }
  const bytes = await readFile(absolute)
  if (bytes.includes(0))
    return { ok: false, failure: 'binary content (NUL byte)' }
  const text = bytes.toString('utf8')
  if (Buffer.from(text, 'utf8').length !== bytes.length)
    return { ok: false, failure: 'not valid UTF-8' }
  return { ok: true, text }
}
