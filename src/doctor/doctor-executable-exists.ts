import { accessSync, constants, statSync } from 'node:fs'
import { delimiter, join } from 'node:path'

export function doctorExecutableExists(
  command: string,
  environ: NodeJS.ProcessEnv,
): boolean {
  const paths = command.includes('/')
    ? [command]
    : (environ['PATH'] ?? '/usr/bin:/bin')
        .split(delimiter)
        .map((directory) => join(directory, command))
  for (const path of paths) {
    try {
      accessSync(path, constants.X_OK)
      if (statSync(path).isFile()) return true
    } catch {
      continue
    }
  }
  return false
}
