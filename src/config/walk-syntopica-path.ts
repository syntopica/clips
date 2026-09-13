import { lstatSync, readlinkSync } from 'node:fs'
import { isAbsolute, sep } from 'node:path'

export function walkSyntopicaPath(path: string, directory: string): string {
  const pending = (isAbsolute(path) ? path : `${directory}/${path}`).split(sep)
  const resolved: string[] = []
  let links = 0
  while (pending.length > 0) {
    const part = pending.shift() as string
    if (['', '.'].includes(part)) continue
    if (part === '..') {
      resolved.pop()
      continue
    }
    const candidate = `${sep}${[...resolved, part].join(sep)}`
    const status = lstatSync(candidate, { throwIfNoEntry: false })
    if (status?.isSymbolicLink()) {
      links += 1
      if (links > 40) throw new Error('Symlink cycle')
      const target = readlinkSync(candidate)
      if (isAbsolute(target)) resolved.length = 0
      pending.unshift(...target.split(sep))
    } else resolved.push(part)
  }
  return `${sep}${resolved.join(sep)}`
}
