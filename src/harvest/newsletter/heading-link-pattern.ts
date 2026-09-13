/** A digest entry with its heading level captured. Medium renders each
 * recommendation as `## [Title](url)` immediately followed by
 * `### [Subtitle](url)` pointing at the same article, so the level is the only
 * thing that distinguishes the two.
 *
 * `#{1,6}` rather than `#{2,6}`: `digestLinkLine` emits whatever level the
 * source heading carried, and an `h1` title that this pattern refused to index
 * would fall through to `headingLevel: null` and lose to its own `h3`
 * subtitle - the exact inversion `prefersTitle` exists to prevent. */
export const HEADING_LINK_PATTERN =
  /^[ \t]*(#{1,6})[ \t]+\[((?:[^[\]\\]|\\.){4,200})\]\((https:\/\/[^\s)]+)\)/gmu
