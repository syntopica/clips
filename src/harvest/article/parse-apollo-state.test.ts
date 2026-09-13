import { describe, expect, it } from 'vitest'
import { MEDIUM_ARTICLE_FIXTURE } from './medium-article-fixture.ts'
import { parseApolloState } from './parse-apollo-state.ts'

describe('parseApolloState', () => {
  it('recovers every cache entry from a real article page', () => {
    const state = parseApolloState(MEDIUM_ARTICLE_FIXTURE)

    expect(Object.keys(state)).toContain('Post:653632330ba9')
    expect(Object.keys(state)).toContain('User:a04624a1a0b')
    expect(
      Object.keys(state).filter((key) => key.startsWith('Paragraph:')),
    ).toHaveLength(9)
  })

  it('stops at the closing script tag rather than at the first brace', () => {
    const state = parseApolloState(MEDIUM_ARTICLE_FIXTURE)

    expect(state['Paragraph:ab5b609961d2_0']).toMatchObject({
      type: 'H3',
      text: 'GLM-5.2 Is Free Right Now, No API Key Needed, and It Surprised Me',
    })
  })

  it('is not stateful across calls', () => {
    expect(parseApolloState(MEDIUM_ARTICLE_FIXTURE)).toEqual(
      parseApolloState(MEDIUM_ARTICLE_FIXTURE),
    )
  })

  it('reads the state even when other scripts follow it', () => {
    expect(MEDIUM_ARTICLE_FIXTURE).toContain('__GRAPHQL_URI__')
    expect(
      parseApolloState(MEDIUM_ARTICLE_FIXTURE)['ROOT_QUERY'],
    ).toMatchObject({ __typename: 'Query' })
  })

  it('names the signed-out case when the state is absent', () => {
    expect(() => parseApolloState('<html><body>Sign in</body></html>')).toThrow(
      /signed out or this URL is not an article/,
    )
  })

  it('throws when the captured state is not valid JSON', () => {
    expect(() =>
      parseApolloState('<script>window.__APOLLO_STATE__ = {oops};</script>'),
    ).toThrow(SyntaxError)
  })

  it('accepts the assignment with or without a trailing semicolon', () => {
    expect(
      parseApolloState('<script>window.__APOLLO_STATE__ = {"a":1}</script>'),
    ).toEqual({ a: 1 })
  })
})
