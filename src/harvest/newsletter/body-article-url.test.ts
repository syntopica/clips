import { describe, expect, it } from 'vitest'
import { bodyArticleUrl } from './body-article-url.ts'
import { normalizeArticleUrl } from './normalize-article-url.ts'

describe('bodyArticleUrl', () => {
  it('puts the sender domain in the host and the local part in the path', () => {
    expect(bodyArticleUrl('author@digest.example', 'The Missing Piece')).toBe(
      'vexa://digest.example/author/the-missing-piece',
    )
  })

  it('slugs away the emoji and punctuation subjects arrive with', () => {
    expect(
      bodyArticleUrl(
        'googleaistudio-noreply@google.com',
        '🚀 Introducing Gemini 3.6 Flash and 3.5 Flash-Lite',
      ),
    ).toBe(
      'vexa://google.com/googleaistudio-noreply/introducing-gemini-3-6-flash-and-3-5-flash-lite',
    )
  })

  it('survives the normalization every promoted URL goes through', () => {
    const url = bodyArticleUrl('tinker@labs.example', 'Inkling-Small')
    expect(normalizeArticleUrl(url)).toBe(url)
  })
})
