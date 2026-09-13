import { describe, expect, it } from 'vitest'
import { MediumGraphqlError } from './medium-graphql-error.ts'
import { parseReadingListResponse } from './parse-reading-list-response.ts'

const post = (id: string, title: string): unknown => ({
  entity: {
    __typename: 'Post',
    id,
    title,
    mediumUrl: `https://medium.com/@someone/${title}-${id}`,
    uniqueSlug: `${title}-${id}`,
    readingTime: 7.5,
    firstPublishedAt: 1_753_000_000_000,
    creator: { name: 'Some One', username: 'someone' },
  },
})

const payload = (items: unknown[], nextPageCursor: unknown): unknown => ({
  data: {
    catalogsByUser: {
      catalogs: [
        {
          id: 'predefined:8bf66de01196:READING_LIST',
          itemsConnection: { items, paging: { nextPageCursor } },
        },
      ],
    },
  },
})

describe('parseReadingListResponse', () => {
  it('maps the catalog items onto saved posts', () => {
    const parsed = parseReadingListResponse(
      payload([post('aaaaaaaaaaaa', 'glm')], null),
    )
    expect(parsed.posts).toEqual([
      {
        id: 'aaaaaaaaaaaa',
        title: 'glm',
        url: 'https://medium.com/@someone/glm-aaaaaaaaaaaa',
        readingTime: 7.5,
        firstPublishedAt: new Date(1_753_000_000_000).toISOString(),
        creator: 'Some One',
      },
    ])
    expect(parsed.nextCursor).toBeNull()
  })

  it('reads the cursor from paging.nextPageCursor.id', () => {
    const parsed = parseReadingListResponse(
      payload([post('bbbbbbbbbbbb', 'next')], { id: 'cursor-2' }),
    )
    expect(parsed.nextCursor).toBe('cursor-2')
  })

  it('keeps only Post entities', () => {
    const parsed = parseReadingListResponse(
      payload(
        [
          post('cccccccccccc', 'kept'),
          { entity: { __typename: 'Collection', id: 'dddddddddddd' } },
        ],
        null,
      ),
    )
    expect(parsed.posts.map((saved) => saved.id)).toEqual(['cccccccccccc'])
  })

  it('defaults the nullable fields rather than dropping the post', () => {
    const parsed = parseReadingListResponse(
      payload(
        [
          {
            entity: {
              __typename: 'Post',
              id: 'eeeeeeeeeeee',
              title: 'bare',
              mediumUrl: 'https://medium.com/@someone/bare-eeeeeeeeeeee',
              readingTime: null,
              firstPublishedAt: null,
              creator: null,
            },
          },
        ],
        null,
      ),
    )
    expect(parsed.posts[0]).toMatchObject({
      readingTime: null,
      firstPublishedAt: null,
      creator: null,
    })
  })

  it('returns an empty page when the catalog list is empty', () => {
    expect(
      parseReadingListResponse({
        data: { catalogsByUser: { catalogs: [] } },
      }),
    ).toEqual({ posts: [], nextCursor: null })
  })

  it('throws MediumGraphqlError on a validation error instead of harvesting nothing', () => {
    const failing = (): unknown =>
      parseReadingListResponse({
        errors: [
          {
            message:
              'Cannot query field "itemsCount". Did you mean "postItemsCount"?',
          },
        ],
      })
    expect(failing).toThrow(MediumGraphqlError)
    expect(failing).toThrow(/postItemsCount/)
  })
})
