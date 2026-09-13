/** Hosts whose posts rank below an ordinary web page.
 *
 * Not a judgement about what is true on them - `sources/x/` holds threads this
 * wiki was written from and they were right. It is about what a post is:
 * unedited, unretractable, and usually one person's reading of something else
 * that has its own url. When a thread and the thing it discusses disagree, the
 * thing wins.
 *
 * Matched on the registrable host and its subdomains, so `mobile.twitter.com`
 * ranks with `twitter.com`. A short list of what this wiki actually cites plus
 * the obvious neighbours; an unlisted host is `web`, which is the safe way to
 * be wrong here - it over-ranks a post rather than under-ranking a source. */
export const SOCIAL_SOURCE_HOSTS: readonly string[] = [
  'x.com',
  'twitter.com',
  'reddit.com',
  'news.ycombinator.com',
  'linkedin.com',
  'mastodon.social',
  'bsky.app',
  'threads.net',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
]
