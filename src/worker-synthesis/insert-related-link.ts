import { relatedSectionEnd } from './related-section-end.ts'

/** `content` with a `[[target]]` link added where a reader of the page looks
 * for one, or unchanged when the page already links there.
 *
 * Into the "Related" or "See also" list when the page has one; otherwise a
 * `See also` line at the end of the body - ahead of a `## Contested` section,
 * which the supersession rule keeps last on the page. */
export const insertRelatedLink = (content: string, target: string): string => {
  const link = `[[${target}]]`
  if (content.includes(link)) return content
  const lines = content.replace(/\n+$/, '').split('\n')
  const related = relatedSectionEnd(lines)
  if (related !== null) {
    lines.splice(related, 0, `- ${link}`)
    return `${lines.join('\n')}\n`
  }
  const contested = lines.findIndex((line) => /^##\s+Contested\b/.test(line))
  const line = `See also: ${link}`
  if (contested === -1) return `${lines.join('\n')}\n\n${line}\n`
  lines.splice(contested, 0, line, '')
  return `${lines.join('\n')}\n`
}
