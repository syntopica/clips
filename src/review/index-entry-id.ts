/** The page id an `index.md` list entry names, or null when the line is not the
 * first line of an entry.
 *
 * The root map is one wrapped list item per page - `- [[topics/x]] — summary`
 * followed by however many continuation lines prettier needs - so only the
 * first line carries the id, and only that line disappearing means the entry
 * did. */
export const indexEntryId = (line: string): string | null => {
  const match = /^- \[\[([^\]]+)\]\]/.exec(line)
  return match?.[1] ?? null
}
