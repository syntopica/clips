/** Reading a candidate page off disk: either the decoded body, or why the file
 * is not an acceptable page at all. Separates the file-shape rules, which every
 * committable file obeys, from the frontmatter rule, which only wiki pages do. */
export type PageTextResult =
  { ok: true; text: string } | { ok: false; failure: string }
