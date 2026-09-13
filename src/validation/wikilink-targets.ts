/** The page ids a markdown body links to, read the way `tools/graph/build.py`
 * reads them so the validator and the orphan count cannot disagree: code spans
 * are stripped first because they quote link syntax rather than link, an alias
 * or anchor after `|` or `#` is dropped, and a target with no `/` is a root
 * reference like `[[SCHEMA]]` rather than a page. */
export const wikilinkTargets = (markdown: string): string[] =>
  [...markdown.replace(/`[^`]*`/gu, '').matchAll(/\[\[([^\]|#]+)/gu)]
    .map((match) => (match[1] ?? '').trim())
    .filter((target) => target.includes('/'))
