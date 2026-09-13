import { diffFileSection } from './diff-file-section.ts'
import { indexEntryId } from './index-entry-id.ts'

/** Why a diff must not be decided by a model, or null when it may be.
 *
 * Checked on the diff text before any reviewer runs, so it is a bound the
 * reviewing model cannot argue its way past rather than an instruction it is
 * asked to respect. It is deliberately narrow, and narrower since 2026-08-08.
 *
 * **A new page is not reserved.** It was, on the reasoning that adding a page
 * is the decision the schema is most opinionated about. Two things make that
 * wrong here. This wiki is young and growing - new topics are the ordinary case
 * rather than the exception, and four of the first nine clips through the gate
 * were creating one - so reserving them left the gate able to decide about half
 * the work. And the risk was already covered mechanically: `orphanPageFailure`
 * refuses a created page no other page links to, before review, and a line in
 * `index.md` does not count as a link. Whether a new page is *warranted* -
 * hub-first, 3+ independent sources or active use in a project - is a judgement,
 * so it belongs in the reviewer's criteria rather than in a blanket refusal.
 *
 * **Losing an index entry is reserved.** The wiki's entry point is what every
 * reader starts from, and a page dropped from the root map is quietly orphaned.
 * What is reserved is the entry, not the text: this asks which page ids leave
 * the list, not whether any `-` line appears in the section.
 *
 * That distinction is the whole rule, and it was the other way round until
 * 2026-09-08. `index.md` has been *derived* since 2026-08-03 - `regenerateIndexMap`
 * rebuilds it from every page's `summary:` frontmatter, and `changeFailure`
 * refuses a synthesis that writes it at all - so a clip that extends an existing
 * page rewrites that page's summary, the generator rewraps its entry, and the
 * diff carries `-` lines with nothing lost. Reading those as a deletion sent 45
 * clips to `needs-claude` in the 2026-08-24/25 auto-review batches under one
 * message, while the very same shape - see `e8a418a4`, `dd87322a` - was being
 * approved by hand as routine on the clips that went through a person. A model
 * still never decides a real removal, because a removal takes the entry's id
 * out of the list and nothing puts it back. */
export const diffNeedsHuman = (diff: string): string | null => {
  const index = diffFileSection(diff, 'index.md')
  if (index === null) return null
  const lines = index.split('\n')
  const added = new Set(
    lines
      .filter((line) => line.startsWith('+') && !line.startsWith('+++ '))
      .map((line) => indexEntryId(line.slice(1)))
      .filter((id): id is string => id !== null),
  )
  for (const line of lines) {
    if (!line.startsWith('-') || line.startsWith('--- ')) continue
    const body = line.slice(1)
    // A section heading only disappears when its whole section does, but it is
    // the one removal that carries no page id of its own to be missed.
    if (body.startsWith('#'))
      return 'the diff removes a section heading from index.md'
    const id = indexEntryId(body)
    if (id !== null && !added.has(id))
      return `the diff drops ${id} from index.md`
  }
  return null
}
