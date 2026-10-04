/** The HTML body out of what `vexa message <id> --json --fields body_html`
 * prints: a one-element list, like every Vexa read verb. A body the cache has
 * evicted comes back null, and reads as empty - the same as a message with no
 * HTML part, which the readers already drop. */
export const vexaMessageHtml = (stdout: string): string => {
  const parsed: unknown = JSON.parse(stdout)
  if (!Array.isArray(parsed)) return ''
  const first: unknown = parsed[0]
  if (typeof first !== 'object' || first === null) return ''
  const body = (first as Record<string, unknown>)['body_html']
  return typeof body === 'string' ? body : ''
}
