import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Writes named fixture files into a directory, creating it when needed. */
export const writeTestFiles = (
  directory: string,
  files: Record<string, string>,
): void => {
  mkdirSync(directory, { recursive: true })
  for (const [name, body] of Object.entries(files))
    writeFileSync(join(directory, name), body)
}
