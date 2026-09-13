/** The values of a `sources:` list, given its raw frontmatter lines.
 *
 * Every reader of the field needs this and each used to spell it itself, which
 * is how they drifted apart: `pageSources` learned on 2026-08-08 to stop at the
 * first token so an annotated entry survived, and the two readers in `grade/`
 * did not hear about it until 2026-08-24, losing a page two X threads for
 * sixteen days in between. One reader so the next correction reaches all three.
 *
 * A **bare** entry ends at its first space, because the annotations this wiki
 * writes by hand - `(clipped <date>, clip_id <id>)` - are not part of the
 * value, and its continuation lines carry no `-` and are skipped.
 *
 * That rule alone cannot express a path whose own name contains spaces, which
 * is not hypothetical: `business/tax-payment-receipt.md` cites two tax-agency
 * payment receipts whose filenames carry them, so every reader saw a directory
 * that does not exist and a tax page graded against no evidence at all. A
 * **quoted** entry says the spaces are the value, and is taken whole - across
 * lines, because prettier wraps a long quoted scalar here rather than leaving
 * it alone, and a YAML flow scalar folds each wrap back to the single space it
 * replaced. Only a quote the same list closes is honoured; an unterminated one
 * yields nothing rather than swallowing the rest of the frontmatter. */
export const sourceEntryValues = (lines: readonly string[]): string[] => {
  const values: string[] = []
  let open: { quote: string; parts: string[] } | null = null
  for (const line of lines) {
    if (open !== null) {
      const closed = line.indexOf(open.quote)
      if (closed === -1) {
        open.parts.push(line.trim())
        continue
      }
      values.push([...open.parts, line.slice(0, closed).trim()].join(' '))
      open = null
      continue
    }
    const quoted = /^\s*-\s*(["'])(.*)$/.exec(line)
    if (quoted !== null) {
      const [, quote = '', rest = ''] = quoted
      const closed = rest.indexOf(quote)
      if (closed === -1) open = { quote, parts: [rest.trim()] }
      else values.push(rest.slice(0, closed))
      continue
    }
    const bare = /^\s*-\s+(\S+)/.exec(line)?.[1]
    if (bare !== undefined) values.push(bare)
  }
  return values
}
