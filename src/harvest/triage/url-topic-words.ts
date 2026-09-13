/** The readable words a Medium-style URL carries in its final path segment.
 *
 * Medium builds that segment from the article's own title and appends a hex id,
 * so the slug is a second copy of the headline. It matters because a newsletter
 * digest sometimes renders the link text as subscription boilerplate - literal
 * "Member only" or "Free read" - and the title is then worthless while the slug
 * still names the topic. Classifying on the title alone rejected 13 such
 * articles in the 2026-07-29 harvest (audit: sources/newsletter-triage/).
 *
 * The trailing hex id and any numeric-only fragments are dropped so the model
 * sees words, not noise. A URL that yields nothing readable returns an empty
 * string rather than a guess.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const urlTopicWords = (url: string): string => {
  const path = URL.parse(url)?.pathname ?? ''
  const segment = path.split('/').filter(Boolean).at(-1) ?? ''
  return segment
    .split('-')
    .filter((word) => word.length > 0 && !/^[0-9a-f]{6,}$/u.test(word))
    .join(' ')
}
