/** How far back the sweep reaches when no previous newsletter run is on disk.
 *
 * That is the state of a fresh clone, not an exotic one: `inbox/` is gitignored
 * and its own docstring calls it "a drop zone the user reads and then empties".
 * The alternative floor - read everything - is the unbounded sweep the window
 * exists to prevent, and it is expensive at both ends: `noreply@medium.com`
 * alone carries 1,872 messages, and the 2026-07-30 run over that archive
 * produced 1,499 articles to classify, which is the first stage that spends
 * quota. A month is enough for a new machine to pick up where the mail is, and
 * `--since` is there for a deliberate backfill. */
export const NEWSLETTER_BACKFILL_DAYS = 30
