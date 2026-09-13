import type { FetchReadingListInput } from './fetch-reading-list-input.ts'
import { mediumGraphqlHeaders } from './medium-graphql-headers.ts'
import { parseReadingListResponse } from './parse-reading-list-response.ts'
import { READING_LIST_QUERY } from './reading-list-query.ts'
import type { SavedPost } from './saved-post.ts'

/** Walks the predefined reading-list catalog until Medium stops returning a
 * cursor. `paging.nextPageCursor.id` from one page is fed back as
 * `pagingOptions.cursor.id` of the next, which is the only paging mechanism
 * the endpoint offers. The catalog page size stays small because
 * `PREDEFINED_LIST` yields a single catalog; the item page size is what
 * actually paginates.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:142-181. */
export const fetchReadingList = async (
  input: FetchReadingListInput,
): Promise<SavedPost[]> => {
  const posts: SavedPost[] = []
  let cursor: string | null = null
  do {
    const body = JSON.stringify({
      operationName: 'ReadingList',
      query: READING_LIST_QUERY,
      variables: {
        u: input.userId,
        cp: { limit: 5 },
        ip:
          cursor === null
            ? { limit: 25 }
            : { limit: 25, cursor: { id: cursor } },
        t: 'PREDEFINED_LIST',
      },
    })
    const page = parseReadingListResponse(
      await input.post(
        body,
        mediumGraphqlHeaders(input.cookies, 'ReadingList'),
      ),
    )
    posts.push(...page.posts)
    cursor = page.nextCursor
  } while (cursor !== null)
  return posts
}
