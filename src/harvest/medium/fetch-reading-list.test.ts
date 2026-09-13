import { describe, expect, it } from 'vitest'
import { fetchReadingList } from './fetch-reading-list.ts'

const page = (id: string, nextPageCursor: unknown): unknown => ({
  data: {
    catalogsByUser: {
      catalogs: [
        {
          id: 'predefined:8bf66de01196:READING_LIST',
          itemsConnection: {
            items: [
              {
                entity: {
                  __typename: 'Post',
                  id,
                  title: `post ${id}`,
                  mediumUrl: `https://medium.com/@someone/post-${id}`,
                  readingTime: 3,
                  firstPublishedAt: 1_753_000_000_000,
                  creator: { name: 'Some One', username: 'someone' },
                },
              },
            ],
            paging: { nextPageCursor },
          },
        },
      ],
    },
  },
})

describe('fetchReadingList', () => {
  it('collects both pages and threads the cursor', async () => {
    const bodies: string[] = []
    const posts = await fetchReadingList({
      userId: '8bf66de01196',
      cookies: new Map([
        ['sid', '1:abc'],
        ['xsrf', 'token-value'],
      ]),
      post: async (body) => {
        bodies.push(body)
        return Promise.resolve(
          bodies.length === 1
            ? page('aaaaaaaaaaaa', { id: 'cursor-2' })
            : page('bbbbbbbbbbbb', null),
        )
      },
    })

    expect(posts.map((saved) => saved.id)).toEqual([
      'aaaaaaaaaaaa',
      'bbbbbbbbbbbb',
    ])
    expect(bodies).toHaveLength(2)

    const first = JSON.parse(bodies[0] ?? '{}') as {
      variables: { u: string; ip: Record<string, unknown>; t: string }
    }
    expect(first.variables.u).toBe('8bf66de01196')
    expect(first.variables.t).toBe('PREDEFINED_LIST')
    expect(first.variables.ip['cursor']).toBeUndefined()

    const second = JSON.parse(bodies[1] ?? '{}') as {
      variables: { ip: { cursor: { id: string } } }
    }
    expect(second.variables.ip.cursor.id).toBe('cursor-2')
  })

  it('stops after one request when there is no cursor', async () => {
    let calls = 0
    const posts = await fetchReadingList({
      userId: '8bf66de01196',
      cookies: new Map(),
      post: async () => {
        calls += 1
        return Promise.resolve(page('cccccccccccc', null))
      },
    })
    expect(calls).toBe(1)
    expect(posts).toHaveLength(1)
  })

  it('sends the CSRF token taken from the xsrf cookie', async () => {
    let sent: Record<string, string> = {}
    await fetchReadingList({
      userId: '8bf66de01196',
      cookies: new Map([['xsrf', 'token-value']]),
      post: async (_body, headers) => {
        sent = headers
        return Promise.resolve(page('dddddddddddd', null))
      },
    })
    expect(sent['x-xsrf-token']).toBe('token-value')
    expect(sent['graphql-operation']).toBe('ReadingList')
  })
})
