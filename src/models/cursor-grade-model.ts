/** The model Cursor grades on, and it is chosen for whose pages it has to
 * judge rather than for being the best on the account.
 *
 * Grading is fine-tier work under the standing routing rule: a handful of pages
 * per batch, an answer nothing downstream re-reads. What makes this transport
 * worth adding is not capability but independence - the pages waiting to be
 * graded were written by codex, and the agy tiers wrote the rest, so a model on
 * a third account is further from being its own verifier than any model already
 * wired here.
 *
 * A Cursor-trained model rather than one of the third-party entries, since
 * 2026-09-12. The subscription meters two pools, and they are not the same
 * size: third-party models (Anthropic, OpenAI, Google) draw on a small
 * allowance that `claude-opus-5-thinking-high` emptied in a day - the usage
 * panel read `Third Party 100%` against `Cursor <1%` - while Cursor's own
 * `composer-*` and `cursor-grok-*` entries draw on the large one. The lane
 * exists to spend an otherwise idle subscription, so it has to spend the pool
 * that is actually there. Grok 4.6 High is the stronger reasoner of the two
 * Cursor families, and the verifier is where being right matters most.
 *
 * Not one of the `NO ZDR` entries in `cursor-agent --list-models`, which at the
 * time of writing are the `claude-fable-5-thinking-*` pair. A grader is handed
 * the full text of captured articles and of the page under judgement, so zero
 * data retention is the one model property this lane cannot trade away. */
export const CURSOR_GRADE_MODEL = 'cursor-grok-4.6-high'
