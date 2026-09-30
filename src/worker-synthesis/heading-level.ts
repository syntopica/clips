/** The markdown heading level of a line, or 0 when it is not a heading. */
export const headingLevel = (line: string): number =>
  /^#+(?=\s)/.exec(line)?.[0].length ?? 0
