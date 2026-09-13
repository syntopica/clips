/** The part of a multi-file diff that belongs to one path, or null when the
 * diff does not touch it. Runs from that file's `diff --git` header to the next
 * one, so a hunk's `-` and `+` lines can be read without another file's hunks
 * bleeding in. */
export const diffFileSection = (diff: string, path: string): string | null => {
  const lines = diff.split('\n')
  const start = lines.findIndex((line) =>
    line.startsWith(`diff --git a/${path} b/${path}`),
  )
  if (start === -1) return null
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => line.startsWith('diff --git '))
  return [lines[start], ...(end === -1 ? rest : rest.slice(0, end))].join('\n')
}
