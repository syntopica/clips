/** A `cat-file --batch-check` answer for a name that resolved to a commit:
 * `<sha> commit <size>`. A miss reads `<name> missing` or `<name> ambiguous`. */
export const RESOLVED_COMMIT_LINE = /^([0-9a-f]{40,64}) commit \d+$/
