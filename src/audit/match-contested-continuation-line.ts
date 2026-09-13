/** Match an indented continuation of a `## Contested` bullet and return its
 * text, trimmed of trailing whitespace, or undefined when the line is not a
 * continuation. */
export const matchContestedContinuationLine = (
  line: string,
): string | undefined => /^\s+(\S.*)$/.exec(line)?.[1]?.trimEnd()
