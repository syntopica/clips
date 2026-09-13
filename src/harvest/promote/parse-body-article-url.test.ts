import { describe, expect, it } from 'vitest'
import { bodyArticleUrl } from '../newsletter/body-article-url.ts'
import { parseBodyArticleUrl } from './parse-body-article-url.ts'

describe('parseBodyArticleUrl', () => {
  it('round-trips what bodyArticleUrl builds', () => {
    expect(
      parseBodyArticleUrl(
        bodyArticleUrl('author@digest.example', 'The Missing Piece'),
      ),
    ).toEqual({ sender: 'author@digest.example', slug: 'the-missing-piece' })
  })

  it('rejects an https URL', () => {
    expect(
      parseBodyArticleUrl('https://medium.com/@a/post-000000000001'),
    ).toBeNull()
  })

  it('rejects a vexa URL missing its slug', () => {
    expect(parseBodyArticleUrl('vexa://digest.example/author')).toBeNull()
    expect(parseBodyArticleUrl('vexa://digest.example/author/')).toBeNull()
  })
})
