import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Writes a file at the given path inside root, creating parent directories
 * as needed. */
export const write = (root: string, path: string, text: string): void => {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), text)
}
