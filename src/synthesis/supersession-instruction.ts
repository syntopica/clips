/** What every synthesis transport tells its model about a belief it replaces.
 *
 * The other half of the contradiction rule the prompts already carry. That one
 * covers two sources disagreeing **now**: record both, state the higher-ranked
 * one as current. This covers the case where nothing disagrees any more -
 * the page said one thing, the clip settles it the other way, and the old
 * sentence would simply be deleted. Deleting it loses the only record that the
 * wiki ever held it, which is what a reader needs a month later to tell a
 * corrected belief from one that was never examined.
 *
 * One constant across the three prompts for `CLAIM_MARKER_INSTRUCTION`'s
 * reason: validation refuses a change that drops a contested entry whatever
 * wrote it, and a rule the gate enforces must not drift between transports.
 *
 * The date is asked for explicitly because it is the half `clips audit` can
 * check. "Never because it is newer" repeats the authority order on purpose -
 * recency was the implicit rule until the order was written down, and this is
 * exactly the moment a model reaches for it. */
export const SUPERSESSION_INSTRUCTION = `- When this clip does not merely disagree with a page but REPLACES what it
  says - the old statement is no longer what the wiki holds - keep the old one.
  Move it into a "## Contested" section at the end of that page as a dated
  entry: "- YYYY-MM-DD: the page held X; it now holds Y, because <why the new
  one outranks>". Never delete a superseded belief, never delete an entry
  already in that section, and never justify the replacement by recency alone.`
