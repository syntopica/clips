import { describe, expect, it } from 'vitest'
import type { SavedPost } from './saved-post.ts'
import { savedPostsAsArticles } from './saved-posts-as-articles.ts'

const RUN_DATE = '2026-07-29'

const post = (overrides: Partial<SavedPost> = {}): SavedPost => ({
  id: '21a628332e97',
  title: 'Claude Code Ultraplan Launched',
  url: 'https://medium.com/@joe.njenga/claude-code-ultraplan-21a628332e97',
  readingTime: 7,
  firstPublishedAt: '2026-07-14T09:12:00.000Z',
  creator: 'Joe Njenga',
  ...overrides,
})

describe('savedPostsAsArticles', () => {
  it('dates an article by its publication day', () => {
    expect(savedPostsAsArticles([post()], RUN_DATE)[0]?.firstSeen).toBe(
      '2026-07-14',
    )
  })

  it('falls back to the run date when Medium gave no publication date', () => {
    expect(
      savedPostsAsArticles([post({ firstPublishedAt: null })], RUN_DATE)[0]
        ?.firstSeen,
    ).toBe(RUN_DATE)
  })

  it('normalizes the url the same way the newsletter lane does, so the two dedup together', () => {
    const saved = savedPostsAsArticles(
      [
        post({
          url: 'https://medium.com/@joe.njenga/claude-code-ultraplan-21a628332e97?source=user_lists',
        }),
      ],
      RUN_DATE,
    )
    expect(saved[0]?.url).toBe(
      'https://medium.com/@joe.njenga/claude-code-ultraplan-21a628332e97',
    )
  })

  it('marks the source so the triage output can say where an article came from', () => {
    expect(savedPostsAsArticles([post()], RUN_DATE)[0]?.sender).toBe(
      'medium-list',
    )
  })
})
