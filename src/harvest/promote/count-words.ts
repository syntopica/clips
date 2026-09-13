/** Whitespace-separated token count of the extracted body, which is what
 * `word_count` means for every other clip in the store. */
export const countWords = (body: string): number =>
  body.split(/\s+/u).filter((token) => token !== '').length
