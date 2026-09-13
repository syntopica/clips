import { resolveSyntopicaPath } from './resolve-syntopica-path.ts'

export function resolveSyntopicaBrowser(
  executable: string | null,
  directory: string,
): string | null {
  return executable?.includes('/')
    ? resolveSyntopicaPath(executable, directory)
    : executable
}
