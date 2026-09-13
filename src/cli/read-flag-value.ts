/** The argument after a value flag.
 *
 * A missing value and a following flag are the same mistake: `--source
 * --dry-run` means the user forgot the source, and taking `--dry-run` as the
 * value would run the wrong collector rather than say so. */
export const readFlagValue = (
  rest: string[],
  index: number,
  option: string,
): string => {
  const value = rest[index + 1]
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${option} needs a value`)
  }
  return value
}
