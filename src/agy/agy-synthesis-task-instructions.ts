import { CLAIM_MARKER_INSTRUCTION } from '../citations/claim-marker-instruction.ts'
import { SATURATION_INSTRUCTION } from '../synthesis/saturation-instruction.ts'
import { SUPERSESSION_INSTRUCTION } from '../synthesis/supersession-instruction.ts'
import { WIKI_REGISTER_INSTRUCTION } from '../synthesis/wiki-register-instruction.ts'

/** The second half of the agy synthesis prompt: the wiki-writing rules,
 * contradiction and supersession handling, and the closing response format.
 * Split out of agySynthesisPrompt purely to keep that function under the line
 * limit - concatenated onto agySynthesisUntrustedPageIntro's output it
 * reproduces exactly the original prompt bytes, which promptSha256 records. */
export const agySynthesisTaskInstructions = (
  worktree: string,
  guidance: string,
): string =>
  `Write or update 1-3 markdown pages there that durably capture what the clip
teaches.

- Use ABSOLUTE paths for every file you read or write, each one starting with
  ${worktree}/. A relative path will not land in the wiki.
- Pages live only under ${worktree}/projects/, /business/, /people/, /topics/
  or /personal/. Filenames are kebab-case.md.
- Prefer updating an existing page over creating a near-duplicate: read
  ${worktree}/index.md and any related pages first.
- Every page starts with frontmatter: title, type (project|business|person|
  topic|personal), updated (today, YYYY-MM-DD), summary (single-quoted, one
  line, no wikilinks - it is the line index.md lists the page by), sources (the
  clip url).
- A page whose frontmatter contains "reviewed: true" is curated and MUST NOT be
  modified; the pipeline rejects any change to it.
- Body: a one-paragraph summary first, then detail sections. Cross-link with
  [[folder/name]]. English only.
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
- A page you create must be linked FROM at least one other page - the project
  or topic page it serves. A line in index.md does not count and the pipeline
  rejects a new page nothing else links to.
- Do NOT touch ${worktree}/index.md. The root map is generated from each page's
  summary after you finish; editing it fails the run. Read it freely.
- Do not commit. Do not touch .ingest/ or any other file.
${guidance === '' ? '' : `\n${guidance}\n`}
Finish by responding with only the JSON object: pages_touched (the paths you
wrote, RELATIVE to ${worktree}), needs_claude (true if the clip needs human
judgement you cannot supply - then write no pages), reason (one sentence).`
