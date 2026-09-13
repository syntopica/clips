import type { z } from 'zod'
import type { SAVED_POST_ENTITY_SCHEMA } from './saved-post-entity-schema.ts'
import type { SavedPost } from './saved-post.ts'

/** Reduce a validated `Post` entity to the fields the harvest pipeline
 * consumes. The publication date arrives as epoch milliseconds when Medium
 * honours its own Long scalar, so it is converted; a string is passed through
 * because `SavedPost` declares the field as one. */
export const entityAsSavedPost = (
  entity: z.infer<typeof SAVED_POST_ENTITY_SCHEMA>,
): SavedPost => ({
  id: entity.id,
  title: entity.title,
  url: entity.mediumUrl,
  readingTime: entity.readingTime ?? null,
  firstPublishedAt:
    typeof entity.firstPublishedAt === 'number'
      ? new Date(entity.firstPublishedAt).toISOString()
      : (entity.firstPublishedAt ?? null),
  creator: entity.creator?.name ?? null,
})
