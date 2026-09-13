/** The Apollo `Post:` entry reduced to what the extractor needs: the header
 * fields plus the refs it follows to reach the creator and the body. */
export type PostEntryFields = {
  title: string
  url: string
  isLocked: boolean
  creatorRef: string | null
  paragraphRefs: string[]
}
