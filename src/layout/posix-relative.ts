import { relative, sep } from 'node:path'

/** `path.relative` spelled with forward slashes, the way git names paths. */
export const posixRelative = (from: string, to: string): string =>
  relative(from, to).split(sep).join('/')
