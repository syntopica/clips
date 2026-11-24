/** What the codex transport is told about the frontmatter of a page that
 * already exists.
 *
 * Measured on 2026-11-24: eight clips in a row synthesized on codex failed the
 * review gate, six of them because the draft rewrote or reflowed the page's
 * `summary` - and with it the generated index line - or reworded text the page
 * already had. The reviewer counts that as dropping existing content, and it
 * is right to: a summary describes the whole page, and one article rarely
 * changes what the page is about. */
export const EXISTING_FRONTMATTER_INSTRUCTION = `- On a page that already exists, add; do not rewrite. Leave its \`title\` and
  \`summary\` exactly as they are, character for character and with the same
  line breaks, and leave every existing sentence and section in place. Change
  only \`updated\`, append to \`sources\` and \`contradictions\`, and put what the
  clip taught in new text. State a source's claim as that source's claim.`
