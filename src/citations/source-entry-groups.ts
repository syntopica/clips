/** The raw lines of a `sources:` block grouped one entry each: a line opening
 * with `-` starts an entry and every following line continues it, which keeps a
 * quoted value folded across lines in one piece. */
export const sourceEntryGroups = (block: readonly string[]): string[][] => {
  const groups: string[][] = []
  for (const line of block) {
    const last = groups.at(-1)
    if (/^\s*-/.test(line) || last === undefined) groups.push([line])
    else last.push(line)
  }
  return groups
}
