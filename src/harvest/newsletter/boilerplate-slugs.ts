/** Medium's own footer posts. They carry a post id like any article, so the
 * post-id test alone cannot reject them. Measured over 183 digests: each of
 * these appeared 178 times, once per email that had a footer. */
export const BOILERPLATE_SLUGS: readonly string[] = [
  'work-at-medium',
  'medium-privacy-policy',
  'medium-terms-of-service',
]
