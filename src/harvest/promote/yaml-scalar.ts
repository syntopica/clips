/** One frontmatter scalar. Strings are always double-quoted with JSON escaping,
 * which is valid YAML and sidesteps every case where an unquoted value would be
 * reinterpreted - a title starting with `-`, one reading `yes` or `null`, one
 * containing a colon. Medium titles hit all three. */
export const yamlScalar = (value: string | number | boolean | null): string => {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  return String(value)
}
