import { frontmatterListLines } from '../audit/frontmatter-list-lines.ts'
import { sourceEntryValues } from './source-entry-values.ts'

/** The source urls listed under `sources:` in a wiki page's frontmatter.
 *
 * A `sources:` list also carries free-text provenance lines - "capture archive clip
 * <id> (date)" is the shape step 7a of the vault fold left behind - so the
 * filter is on the url, not on the list membership. Frontmatter ends at the
 * second `---`; anything after it is body text and is never read here, which is
 * what keeps a url quoted inside a paragraph out of the evidence set.
 *
 * `vexa://` counts alongside http(s). A newsletter whose article is the mail
 * body itself has no web page to cite, so the harvest gives it the synthetic
 * identity `vexa://<sender-domain>/<sender-local>/<subject-slug>` and promotes
 * the body to a clip under that url. Matching only `https?://` therefore hid a
 * whole class of evidence that was on disk the entire time: measured
 * 2026-08-21, all 37 findings the grader reported on
 * `topics/open-model-economics.md` traced to exactly this, and 24 pages across
 * the wiki cite 42 distinct `vexa://` sources, every one of which has a clip.
 * Same shape as the X-thread evidence class the audit gained on 2026-08-11 and
 * the grader on 2026-08-22 - the page cited real evidence and the reader could
 * not open it.
 *
 * An entry may be annotated, and the annotation does not take the source away.
 * The line was once anchored at `$` to keep the free-text provenance lines out,
 * but those start with text rather than a url and never matched anyway, while
 * the anchor did throw away `- <url> (clipped <date>, clip_id <id>)` - a whole
 * entry, silently, for being documented. Measured 2026-08-24 on
 * `topics/claude-skills-ecosystem.md`: 28 entries listed, 25 read, and the
 * three dropped were the two X threads carrying every name in the residue the
 * 2026-08-21 grade could not support, plus a `clips/` path. That residue had
 * been triaged twice as possible overreach by a search of `sources/x/` in this
 * repo; the clips were in `capture archive`, processed, since July. */
export const pageSourceUrls = (page: string): string[] =>
  sourceEntryValues(frontmatterListLines(page, 'sources')).filter((value) =>
    /^(?:https?|vexa):\/\//.test(value),
  )
