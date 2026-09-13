import { z } from 'zod'
import type { MediumArticle } from './medium-article.ts'
import { paragraphToMarkdown } from './paragraph-to-markdown.ts'
import { parseApolloState } from './parse-apollo-state.ts'
import { postEntry } from './post-entry.ts'
import { postParagraphs } from './post-paragraphs.ts'

/** Turns a fetched Medium article page into the body and metadata a clip
 * directory needs. Medium repeats the title as the first paragraph (an `H3` on
 * the observed article), so a leading paragraph equal to the title is dropped -
 * the title is already frontmatter, and repeating it as a heading would make
 * every clip open with a duplicate. Empty renders are filtered before joining
 * so a skipped image or embed leaves no blank block.
 *
 * The author is a `__ref` into a `"User:<id>"` entry rather than an inline
 * name, and it is optional: a post whose creator is not cached yields `null`
 * instead of failing the whole extraction.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const extractMediumArticle = (html: string): MediumArticle => {
  const state = parseApolloState(html)
  const post = postEntry(state)
  const paragraphs = postParagraphs(state, post.paragraphRefs)

  const creator = z
    .object({ name: z.string() })
    .safeParse(post.creatorRef === null ? undefined : state[post.creatorRef])

  const body =
    paragraphs[0]?.text === post.title ? paragraphs.slice(1) : paragraphs

  return {
    title: post.title,
    url: post.url,
    author: creator.success ? creator.data.name : null,
    isLocked: post.isLocked,
    body: body
      .map((paragraph) => paragraphToMarkdown(paragraph))
      .filter((rendered) => rendered.length > 0)
      .join('\n\n'),
  }
}
