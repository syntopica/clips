/** Frontmatter-wrapped page body citing the given sources, for the tests of
 * checks that read `sources:` and the claim markers in the body. */
export const pageWithSources = (
  sources: readonly string[],
  body: string,
): string =>
  `---\ntitle: t\ntype: topic\nupdated: 2026-08-03\nsources:\n${sources.map((source) => `  - ${source}\n`).join('')}---\n\n${body}\n`
