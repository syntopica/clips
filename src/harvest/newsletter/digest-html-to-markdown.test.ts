import { describe, expect, it } from 'vitest'
import { digestHtmlToMarkdown } from './digest-html-to-markdown.ts'

describe('digestHtmlToMarkdown', () => {
  it('gives an anchor-wrapped title and subtitle their own heading levels', () => {
    const html =
      '<a href="https://medium.com/@a/post-000000000001">' +
      '<h2>Everyone Says Graphify Cut Their AI Coding Bill 70x.</h2>' +
      '<div><h3>Open any developer feed right now</h3></div>' +
      '</a>'

    expect(digestHtmlToMarkdown(html)).toBe(
      '## [Everyone Says Graphify Cut Their AI Coding Bill 70x.](https://medium.com/@a/post-000000000001)\n\n' +
        '### [Open any developer feed right now](https://medium.com/@a/post-000000000001)',
    )
  })

  it('keeps the level when the heading wraps the anchor instead', () => {
    const html = '<h2><a href="https://example.com/x">Some Title</a></h2>'

    expect(digestHtmlToMarkdown(html)).toBe(
      '## [Some Title](https://example.com/x)',
    )
  })

  it('emits a link with no hashes when it sits outside every heading', () => {
    const html = '<p><a href="https://example.com/y">Read more</a></p>'

    expect(digestHtmlToMarkdown(html)).toBe(
      '[Read more](https://example.com/y)',
    )
  })

  it('collapses a title broken across source lines onto one line', () => {
    const html =
      '<a href="https://example.com/z">\n  <h2>Why your RAG pipeline\n    is slow</h2>\n</a>'

    expect(digestHtmlToMarkdown(html)).toBe(
      '## [Why your RAG pipeline is slow](https://example.com/z)',
    )
  })

  it('keeps an article whose title contains a bracket', () => {
    const html =
      '<a href="https://medium.com/@a/free-12-ai-tools-000000000001">' +
      '<h2>[Free] 12 AI tools that replace paid subscriptions</h2></a>'

    expect(digestHtmlToMarkdown(html)).toBe(
      '## [\\[Free\\] 12 AI tools that replace paid subscriptions](https://medium.com/@a/free-12-ai-tools-000000000001)',
    )
  })
})
