import { pageSources } from '../audit/page-sources.ts'

/** Replace every `[SNEW]` in a page with the position of its last `sources:`
 * entry, and return the rewritten text.
 *
 * The scheme it removes work from: claim markers are **positional** over a
 * page's own `sources:` list, and the position is not knowable when the
 * synthesis prompt is built, because the model chooses which page it updates.
 * So the model was asked to count - on
 * `topics/claude-code-practice.md` that means counting to 121 - and it got the
 * arithmetic wrong twice in eleven clips on 2026-08-08: once citing `S131` over
 * a 123-entry list, once inserting its entry at position 25 of 32 instead of
 * appending. Both cost a full synthesis and a trip to `needs-claude`.
 *
 * `SNEW` means "the source this clip just appended", which the model does know
 * without counting. Resolving it here is arithmetic done by the side that can
 * see the list.
 *
 * It resolves to the **last** entry rather than to a remembered index because
 * `appendOnlySources` already guarantees new entries land at the end - the two
 * rules hold each other up. A page with no sources leaves the marker alone, so
 * the existing "names no entry" failure reports it rather than this producing
 * `[S0]`.
 *
 * The label in a page's own `## Sources` list carries no brackets - the lines
 * there read `- S23 - <url>` - so the model writes `- SNEW -` and only the
 * bracketed form was resolved until 2026-09-11, when a clip cited `[S24]` in
 * its claims and left `- SNEW -` in the list underneath. Both spellings are
 * the same marker, so both resolve; the bare one is anchored to the start of a
 * list line, because `SNEW` loose in prose is not a citation. */
export const resolveNewSourceMarker = (page: string): string => {
  const count = pageSources(page).length
  if (count === 0) return page
  const marker = `S${String(count)}`
  return page
    .replaceAll('[SNEW]', `[${marker}]`)
    .replace(/^- SNEW\b/gm, `- ${marker}`)
}
