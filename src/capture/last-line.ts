/** The last non-empty line of a message.
 *
 * `runCommand` rejects with the whole spawn failure - the command line, then the
 * transport's own stderr - and the last line is the part that says what the far
 * end answered. The rest goes into a clip's `note`, where it is noise. */
export const lastLine = (message: string): string => {
  const lines = message.trim().split('\n')
  return lines[lines.length - 1]?.trim() ?? message
}
