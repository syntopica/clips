/** The level of an `h1`-`h6` tag name, or null for anything else. Case is
 * normalized because a DOM reports `H2` while a selector matches `h2`. */
export const headingTagLevel = (tagName: string): number | null => {
  const match = /^h([1-6])$/i.exec(tagName)
  return match?.[1] === undefined ? null : Number(match[1])
}
