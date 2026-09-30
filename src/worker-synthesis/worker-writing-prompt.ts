import type { WorkerShownPage } from './worker-shown-page.ts'
import { workerUntrustedClip } from './worker-untrusted-clip.ts'
import { workerWritingRules } from './worker-writing-rules.ts'

/** The second worker pass: the clip, the pages the first pass chose, and every
 * page path, and the rules for writing - answered with whole pages.
 *
 * The shown pages are the wiki's own text and are marked as such, apart from
 * the untrusted clip. `guidance` is why earlier drafts of this clip were
 * rejected, and the empty string adds nothing. */
export const workerWritingPrompt = (input: {
  clipText: string
  shown: readonly WorkerShownPage[]
  pagePaths: readonly string[]
  directories: readonly string[]
  today: string
  guidance: string
}): string => {
  const shown = input.shown
    .map(
      ({ path, content }) =>
        `--- BEGIN WIKI PAGE ${path} ---\n${content}\n--- END WIKI PAGE ${path} ---`,
    )
    .join('\n\n')
  return `${workerUntrustedClip(input.clipText)}You are synthesizing that page into a private personal wiki (an "LLM wiki":
linked markdown pages, facts not narration). These are the wiki pages it
belongs in, as they are now:

${shown === '' ? '(none)' : shown}

Every page that exists, by path:
${input.pagePaths.join('\n')}

${workerWritingRules(input.directories, input.today)}
${input.guidance === '' ? '' : `\n${input.guidance}\n`}
Answer with only the JSON object: pages (each {path, content, link_from}: the
path relative to the repository, the page's complete new text, and - only for a
page that does not exist yet - link_from, the path of the page shown above that
should link to it), needs_claude (true if the clip needs human judgement you
cannot supply - then pages is empty), reason (one sentence).`
}
