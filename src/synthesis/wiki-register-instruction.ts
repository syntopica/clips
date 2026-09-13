/** How a wiki page is written, as opposed to what goes in it.
 *
 * One constant across the three synthesis prompts, for the reason
 * `CLAIM_MARKER_INSTRUCTION` gives: a rule the review gate enforces cannot be
 * allowed to drift between the transports that have to satisfy it.
 *
 * Each line is a rejection that actually happened, measured over eleven clips
 * on 2026-08-08, in descending order of how often it fired:
 *
 * - **Hedging.** The most repeated correction of the day. A source's "14x
 *   faster" or "surgical precision" arrived in the page as a measured fact.
 * - **Hub-first.** Three of five escalations were a new page standing on one
 *   article, which `SCHEMA.md` already rules out and the reviewer enforces.
 * - **Register.** "To verify service health, use `openclaw gateway status`"
 *   reads as a tutorial and trips the rule against text that instructs. The
 *   declarative form carries the same fact and ages better.
 *
 * The subject-prose rule was added 2026-08-25 and is the largest measurement
 * yet: **8 of 13 rejections in one 47-clip batch** were the same failure, the
 * page narrating the document instead of describing the thing - "The article
 * says", "Mistry groups", "The Daily Dose walkthrough uses". Nothing here
 * covered it, and the gap is structural rather than careless: the attribution
 * rule above demands a claimant, this file never distinguished naming the
 * claimant from making the document the subject, and the reviewer's criterion 4
 * forbids exactly the second. So the synthesizer satisfied one rule by breaking
 * another it had never been told about.
 *
 * Deliberately not an outright ban on the phrase "the article", which is what a
 * first pass proposed: diffs using it have been accepted - the GLM-5.2 clip
 * published with "The article explicitly cautions ..." - so a ban would make
 * this instruction stricter than the gate it exists to satisfy, and the way a
 * model resolves that is by dropping the attribution instead. The rule is about
 * the sentence's subject, and it names the fallback for a piece with no
 * personal byline, which is where the phrase actually gets reached for. */
export const WIKI_REGISTER_INSTRUCTION = `- Attribute, do not assert. A number or a superlative the source claims is
  written as a claim - "the author measured 14x", "Anthropic reports 5-10%" -
  never as a fact the wiki vouches for. Marketing words from the source
  ("surgical precision", "blazing fast") do not belong in the page at all.
- Write about the subject, not about the article. The grammatical subject of a
  sentence is the thing being described, never the document describing it:
  "Hooks run before a tool call", not "the article explains that hooks run
  before a tool call". Attribution names who claims something - "Sah proposes
  hooks as policy gates", "Daily Dose of Data Science reports 3x" - and where
  the piece carries no personal byline, name the publication rather than
  reaching for "the article". This does not weaken the rule above: a
  measurement, a judgement or a framework the source only reports still says
  who reports it. What does not belong is narrating the document - "the source
  argues", "this walkthrough shows", "the article also relays".
- Prefer a section on an existing page to a new page. A new page needs the
  subject to stand on its own: several independent sources, or something the
  wiki's owner actively works on. One article is a section, in the page that
  already covers the area.
- Write declaratively, not as instructions. "The \`--disable\` flag turns it off
  persistently", not "To turn it off persistently, use \`--disable\`". A wiki
  page states how something is; it does not address a reader.`
