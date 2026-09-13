/** Markdown line prefix per Medium paragraph type, for the types whose whole
 * rendering is "prefix plus marked-up text". Medium starts article headings at
 * `H2` and uses `H3` for section headings, so the levels map straight across.
 * `PQ` (pull quote) collapses onto the blockquote prefix because markdown has
 * no separate form for it. A type absent from this table renders as plain text;
 * `PRE` and `IMG` are absent because they are not prefix-shaped.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const PARAGRAPH_PREFIXES: Record<string, string> = {
  H2: '## ',
  H3: '### ',
  H4: '#### ',
  ULI: '- ',
  OLI: '1. ',
  BQ: '> ',
  PQ: '> ',
}
