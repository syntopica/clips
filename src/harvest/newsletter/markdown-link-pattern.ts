/** `digestHtmlToMarkdown` renders a digest body as markdown with links intact,
 * so every recommendation is a `[Title](https://...)` pair by the time it gets
 * here. The 4-200 title bound rejects the one-word chrome at the bottom of
 * every digest and the empty anchors wrapping the thumbnails at the top.
 *
 * The title alternation accepts a backslash escape as one unit, so a title
 * carrying a literal bracket survives; `digestLinkLine` writes those escapes
 * and `digestTitle` removes them. */
export const MARKDOWN_LINK_PATTERN =
  /\[((?:[^[\]\\]|\\.){4,200})\]\((https:\/\/[^\s)]+)\)/g
