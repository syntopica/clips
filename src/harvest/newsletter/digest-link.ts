/** `headingLevel` is what separates an article's real title from its subtitle:
 * Medium renders the title as `##` and the subtitle as `###` pointing at the
 * same URL. A link found outside any heading gets `null`. */
export type DigestLink = {
  url: string
  title: string
  headingLevel: number | null
}
