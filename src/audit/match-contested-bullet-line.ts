/** Match a `## Contested` bullet line and return its text, trimmed of
 * trailing whitespace, or undefined when the line does not start a new
 * entry. */
export const matchContestedBulletLine = (line: string): string | undefined =>
  /^\s*-\s*(\S.*)$/.exec(line)?.[1]?.trimEnd()
