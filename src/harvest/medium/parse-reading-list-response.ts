import { entityAsSavedPost } from './entity-as-saved-post.ts'
import { GRAPHQL_ERRORS_SCHEMA } from './graphql-errors-schema.ts'
import { MediumGraphqlError } from './medium-graphql-error.ts'
import { READING_LIST_PAGE_SCHEMA } from './reading-list-page-schema.ts'
import { SAVED_POST_ENTITY_SCHEMA } from './saved-post-entity-schema.ts'
import type { SavedPost } from './saved-post.ts'

/** Errors first: a validation error is schema drift, not an empty reading list,
 * and it must never be parsed past.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:130-181. */
export const parseReadingListResponse = (
  payload: unknown,
): { posts: SavedPost[]; nextCursor: string | null } => {
  const failed = GRAPHQL_ERRORS_SCHEMA.safeParse(payload)
  if (failed.success)
    throw new MediumGraphqlError(
      failed.data.errors.map((error) => error.message),
    )

  const parsed = READING_LIST_PAGE_SCHEMA.parse(payload)
  const catalog = parsed.data.catalogsByUser.catalogs[0]
  if (catalog === undefined) return { posts: [], nextCursor: null }

  return {
    posts: catalog.itemsConnection.items
      .filter((item) => item.entity['__typename'] === 'Post')
      .map((item) => SAVED_POST_ENTITY_SCHEMA.parse(item.entity))
      .map(entityAsSavedPost),
    nextCursor: catalog.itemsConnection.paging.nextPageCursor?.id ?? null,
  }
}
