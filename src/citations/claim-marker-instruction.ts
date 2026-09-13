/** What every synthesis transport tells its model about attributing a claim.
 *
 * One constant rather than three copies, because three prompts need it -
 * `codexPrompt`, `agySynthesisPrompt` and the interactive
 * `SYNTHESIS_INSTRUCTIONS` - and a rule that validation enforces cannot be
 * allowed to drift between the transports that have to satisfy it.
 *
 * It states the scheme rather than listing this run's refs, which is a
 * departure from the design and the reason for it is mechanical: refs are
 * positional over the page's own `sources:` list, and the model chooses which
 * page it updates, so `S1..Sn` is not knowable when the prompt is built. A page
 * that already carries five sources gives this clip `S6`. The rule is
 * derivable by whoever writes the page and checkable afterwards, which is what
 * the design actually needs.
 *
 * `OWN` is the half a prompt has to carry alone: nothing downstream can tell a
 * first-hand fact from a model's inference dressed as one, so the honesty of
 * that marker is asked for here and nowhere else.
 *
 * No path appears in it. codex writes relative and agy absolute, and the two
 * prompts are otherwise different documents. */
export const CLAIM_MARKER_INSTRUCTION = `- Attribute every factual claim. End the sentence with a marker naming where
  it came from. For the source you are adding for this clip write [SNEW] and do
  not count anything - the pipeline turns it into the right number. Cite a
  source the page already had as [S1] for its first sources: entry, [S2] for the
  second, positional over that page's own list. Use [OWN] for something the wiki's
  owner knows first-hand and no source states. Never mark your own inference
  [OWN] - a claim you cannot attribute is a claim you should not write.
  Validation rejects a marker naming a source the page does not have.
- On a page that carries markers, sources: is append-only: add a new entry at
  the end, never reorder or remove one, because the existing markers already
  point at positions in that list.`
