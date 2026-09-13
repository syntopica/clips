/** A page's wikilink id: its repository path without the `.md`, which is how
 * `tools/graph/build.py` names nodes and how pages cite each other. */
export const pageId = (path: string): string => path.replace(/\.md$/u, '')
