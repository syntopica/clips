import type { Dirent } from 'node:fs'
import { readdir } from 'node:fs/promises'

/** Directory entries under `directory`, directories only. A missing
 * `directory` is normal (e.g. `clips/needs-claude/` before the first clip
 * lands there) and yields an empty list rather than throwing. Anything other
 * than "does not exist" - EACCES chief among them - is rethrown: swallowing
 * it here would make an unreadable directory read back as an empty, healthy
 * one. */
export const readSubdirectories = async (
  directory: string,
): Promise<Dirent[]> =>
  (
    await readdir(directory, { withFileTypes: true }).catch(
      (error: unknown) => {
        if (
          error instanceof Error &&
          'code' in error &&
          (error.code === 'ENOENT' || error.code === 'ENOTDIR')
        )
          return []
        throw error
      },
    )
  ).filter((entry) => entry.isDirectory())
