import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Writes `value` as JSON under `root/name` and returns the file's path. */
export function writeFixtureFile(
  root: string,
  name: string,
  value: unknown,
): string {
  const path = join(root, name)
  writeFileSync(path, JSON.stringify(value))
  return path
}
