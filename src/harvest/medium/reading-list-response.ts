import type { SavedPost } from './saved-post.ts'

export type ReadingListResponse = {
  posts: SavedPost[]
  nextCursor: string | null
}
