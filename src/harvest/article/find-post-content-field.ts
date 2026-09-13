/** Read the post's `content` field, whichever of its two spellings the page
 * used. The live page parameterises it
 * (`content({"postMeteringOptions":{"referrer":""}})`), so it is found by
 * prefix; the unparameterised name is accepted too. */
export const findPostContentField = (
  post: Record<string, unknown>,
): unknown => {
  const content = Object.entries(post).find(
    ([key]) => key === 'content' || key.startsWith('content('),
  )?.[1]
  if (content === undefined)
    throw new Error(
      'The Post entry carries no "content" field, so the article body was not delivered with the page',
    )
  return content
}
