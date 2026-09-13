import { readFile } from 'node:fs/promises'

export const readFileIfPresent = async (
  path: string,
): Promise<Buffer | null> => {
  try {
    return await readFile(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}
