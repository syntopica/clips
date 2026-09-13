/** A body-content message resolved for promotion: the raw HTML becomes
 * `source.html`, its markdown conversion becomes the clip body, and the
 * subject and date become the title and published date. */
export type BodyArticle = {
  subject: string
  date: string
  bodyHtml: string
}
