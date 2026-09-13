import { findPostCacheEntry } from './find-post-cache-entry.ts'
import { findPostContentField } from './find-post-content-field.ts'
import { POST_BODY_SCHEMA } from './post-body-schema.ts'
import type { PostEntryFields } from './post-entry-fields.ts'
import { POST_SUMMARY_SCHEMA } from './post-summary-schema.ts'

/** Reduce the article's `"Post:<id>"` cache entry to the fields the extractor
 * needs. Which entry is the article's own, and which of the two spellings its
 * content field uses, are both decided by the finders this calls.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const postEntry = (state: Record<string, unknown>): PostEntryFields => {
  const post = POST_SUMMARY_SCHEMA.parse(findPostCacheEntry(state))
  const body = POST_BODY_SCHEMA.parse(findPostContentField(post))

  return {
    title: post.title,
    url: post.mediumUrl,
    isLocked: post.isLocked ?? false,
    creatorRef: post.creator?.__ref ?? null,
    paragraphRefs: body.bodyModel.paragraphs.map(
      (reference) => reference.__ref,
    ),
  }
}
