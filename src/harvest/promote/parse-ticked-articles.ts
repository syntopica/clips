import { isIngestHeading } from './is-ingest-heading.ts'
import type { TickedArticle } from './ticked-article.ts'
import { TICKED_ENTRY_PATTERN } from './ticked-entry-pattern.ts'
import { TRIAGE_ENTRY_PATTERN } from './triage-entry-pattern.ts'

/** What one topic file says should be fetched: every entry the classifier put
 * in `Ingest`, plus every line the user ticked anywhere.
 *
 * The `Ingest` bucket is taken without a tick because that is what the bucket
 * means - the spec's step 3 is "fetch only the `ingest` bucket", and its
 * example section carries a `clip_id` per line, which is a record of something
 * already fetched. Until 2026-08-08 this function skipped those plain bullets,
 * so the classifier's strongest verdict had no route into the clip store at
 * all: a run that classified 59 articles as `ingest` promoted none of them, and
 * the only alternative was `--capture-all`, which also takes the rejects.
 *
 * Ticks are still read in every section, including `Rejected`. A tick there is
 * the user disagreeing with the classifier, and honouring it is the whole
 * reason that bucket stays recoverable rather than being dropped. An unticked
 * `Review` line is not an instruction and is skipped.
 *
 * `[gone-410]` lines are skipped wherever they appear: the article is known
 * deleted upstream, and re-requesting it wastes a round trip per run forever.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const parseTickedArticles = (
  markdown: string,
  topic: string,
): TickedArticle[] => {
  const ticked: TickedArticle[] = []
  let inIngest = false
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) inIngest = isIngestHeading(line)
    if (line.includes('[gone-410]')) continue
    const match = (inIngest ? TRIAGE_ENTRY_PATTERN : TICKED_ENTRY_PATTERN).exec(
      line,
    )
    const title = match?.[1]
    const url = match?.[2]
    if (title === undefined || url === undefined) continue
    ticked.push({ url, title, topic })
  }
  return ticked
}
