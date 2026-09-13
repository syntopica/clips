/** Whether this URL's readable content is a transcript Defuddle must fetch.
 *
 * Defuddle ships a YouTube extractor, but the transcript is a second request -
 * it is not in the watch page's HTML - so only `parseAsync()` returns it.
 * `extractPage` deliberately runs the synchronous parse, which is right for
 * every host whose article is already in the bytes and wrong for exactly this
 * one.
 *
 * The predicate is a host list rather than a length threshold on purpose.
 * `MIN_EXTRACTED_LENGTH` says why: `news.ycombinator.com/item?id=1` is 57 words
 * and complete, so "the body came out short, fetch harder" fires on
 * short-but-whole pages. Which hosts hide their text behind a second request is
 * a fact about the host, and a fact is cheaper to check than a heuristic. */
export const isTranscriptHost = (url: string): boolean => {
  const host = URL.parse(url)?.hostname.toLowerCase()
  if (host === undefined) return false
  const bare = host.startsWith('www.') ? host.slice(4) : host
  return (
    bare === 'youtube.com' || bare === 'youtu.be' || bare === 'm.youtube.com'
  )
}
