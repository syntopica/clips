/** A page's wikilink id: its page path without the `.md`, which is how the
 * graph builder names nodes and how pages cite each other. A page path, not a
 * repository path - see `WikiLayout`. */
export const pageId = (path: string): string => path.replace(/\.md$/u, '')
