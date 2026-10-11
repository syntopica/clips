import { workerUntrustedClip } from './worker-untrusted-clip.ts'

/** The first worker pass: which existing wiki pages this clip belongs in.
 *
 * It exists because the model has no tools. A transport that can read files
 * opens the index and then the pages it needs; here every byte the model sees
 * has to be in the prompt, and the whole wiki does not fit in a local model's
 * window. So the index - one line per page - goes to this pass, and only the
 * pages it names go whole to the writing pass.
 *
 * It must name at least one page even when the clip deserves a page of its
 * own, because a new page has to be linked from an existing one and the
 * writing pass can only edit what it was shown. Said twice in the prompt
 * because once was not enough: of 111 worker escalations on 2026-10-05..11, 34
 * were the selection model answering that a new page would be needed. */
export const workerSelectionPrompt = (
  clipText: string,
  indexText: string,
  directories: readonly string[],
): string => `${workerUntrustedClip(clipText)}You are filing that page into a private personal wiki of linked markdown pages.
This is the wiki's index, one line per page:

--- BEGIN INDEX ---
${indexText}
--- END INDEX ---

Choose the one or two existing pages this clip's knowledge belongs in - the
pages that already cover its subject, or the page that should link to a new
page about it. Name each by its path relative to the repository, under one of
${directories.join(', ')} and ending .md; a [[folder/name]] link in the index
is the file folder/name.md inside the directory that holds that folder.

A subject no page covers yet is not a reason to stop: name the existing page
that should link to a new page about it, and the next step writes that page.

Answer with only the JSON object: pages (one or two paths), needs_claude (true
only if the clip needs human judgement you cannot supply, or nothing in it
belongs in this wiki - then pages is empty; never because it needs a new page),
reason (one sentence).`
