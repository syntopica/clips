import { CLAIM_MARKER_INSTRUCTION } from '../citations/claim-marker-instruction.ts'
import { SATURATION_INSTRUCTION } from '../synthesis/saturation-instruction.ts'
import { SUPERSESSION_INSTRUCTION } from '../synthesis/supersession-instruction.ts'
import { WIKI_REGISTER_INSTRUCTION } from '../synthesis/wiki-register-instruction.ts'
import { wikilinkRootNote } from '../synthesis/wikilink-root-note.ts'

/** The page-writing rules of the worker writing prompt: the agy prompt's rules
 * restated for a model that returns pages instead of writing files. The shared
 * instructions are the same constants, so a rule fixed there is fixed here. */
export const workerWritingRules = (
  directories: readonly string[],
  today: string,
): string => `Write or update at most three pages that durably capture what the clip teaches.

- You may rewrite the pages shown above, or create new ones. Never name an
  existing page you were not shown.
- Pages live only under ${directories.join(', ')}. Filenames are kebab-case.md.
- Prefer updating a page shown above over creating a near-duplicate.
- Every page starts with frontmatter: title, type (project|business|person|
  topic|personal), updated (${today}), summary (single-quoted, one line, no
  wikilinks), sources (the clip url appended to the page's list).
- A page whose frontmatter contains "reviewed: true" is curated: do not return
  it at all.
- When you rewrite a page, return all of it: every line you do not change must
  come back exactly as it was.
- Body: a one-paragraph summary first, then detail sections. Cross-link with
  [[folder/name]], naming only pages in the list above or pages you create.${wikilinkRootNote()}
  English only.
${CLAIM_MARKER_INSTRUCTION}

${WIKI_REGISTER_INSTRUCTION}
- When this clip contradicts something a page already says, never silently drop
  either side. Record the disagreement in the page's frontmatter under
  contradictions: (one line, both sides named), and state as current whichever
  source ranks higher in this order: the owner's own knowledge, then a primary
  source (a repository, an official record, the thing itself), then an ordinary
  web page, then a social post. Never decide it by which is newer.
${SUPERSESSION_INSTRUCTION}
${SATURATION_INSTRUCTION}
- A page you create names, in link_from, the page shown above that should link
  to it. The link is added for you; you need not return that page.
- Never state a connection between the clip's subject and a wiki page, project
  or person that neither the clip nor a shown page states.`
