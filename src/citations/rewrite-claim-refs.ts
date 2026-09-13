import { rewriteLineClaimRefs } from './rewrite-line-claim-refs.ts'

/** A page with every bare marker in its prose turned into a link into its own
 * `## Sources` section.
 *
 * The rewrite is mechanical and runs in the pipeline rather than in the
 * author's head, for the reason the index map exists: a convention a person has
 * to remember is a convention that decays. What an author writes is `[S1]`;
 * what a reader clicks is `[[S1]](#sources)`.
 *
 * The same three regions `pageClaimRefs` refuses to read are refused here, and
 * they have to be skipped rather than stripped, because this returns the page.
 * Frontmatter is not prose, the `## Sources` section is provenance rather than
 * a claim, and a marker inside a fence is sample text - this design's own spec
 * is full of it. The fourth, inline code spans, is handled per line by
 * `rewriteLineClaimRefs`.
 *
 * Idempotent through `BARE_CLAIM_REF_PATTERN`, which is what lets this run on
 * every ingest of a page that several earlier ingests already touched. */
export const rewriteClaimRefs = (page: string): string => {
  const lines = page.split('\n')
  const frontmatterEnd = lines[0] === '---' ? lines.indexOf('---', 1) : -1
  let fenced = false
  let inSources = false
  return lines
    .map((line, index) => {
      if (frontmatterEnd !== -1 && index <= frontmatterEnd) return line
      if (/^\s*(?:```|~~~)/u.test(line)) {
        fenced = !fenced
        return line
      }
      if (fenced) return line
      if (line.startsWith('## ')) inSources = /^## Sources\s*$/u.test(line)
      return inSources ? line : rewriteLineClaimRefs(line)
    })
    .join('\n')
}
