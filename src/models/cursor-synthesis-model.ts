/** The model Cursor synthesizes on.
 *
 * Deliberately a different family from `CURSOR_GRADE_MODEL`, even though both
 * spend the same subscription. The author/verifier guard works at tier
 * granularity and refuses the whole cursor tier once cursor has written a page,
 * so this split buys nothing from the guard - it is here for the thing the
 * guard is a proxy for. A page written by Composer and read back by Grok is
 * checked by something that does not share the first model's blind spots, and
 * on the day both ran on this account that is worth more than either being the
 * stronger model.
 *
 * `composer-2.5` rather than `gpt-5.3-codex-high`, since 2026-09-12: the codex
 * entry is a third-party model and drew on the small pool that grading had
 * already emptied, so the two Cursor families are the only pair that both
 * stays within the large pool and keeps the author/verifier split. Composer
 * writes, Grok grades. Not the `-fast` variant: synthesis is already the
 * slowest step in an ingest run, but the fast tier buys latency with quota and
 * the reasoning budget is not what limits page quality here - the clip is.
 * Not a `NO ZDR` entry, for the same reason the grade model is not. */
export const CURSOR_SYNTHESIS_MODEL = 'composer-2.5'
