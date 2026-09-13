import { describe, expect, it } from 'vitest'
import { extractPage } from './extract-page.ts'

const PROSE =
  'This is a paragraph with enough words in it to clear the hundred character minimum that rejects a trivial wrapper page.'

const POST_URL = 'https://example.com/post'
const NO_CONTENT_URL = 'https://example.com/x'

const page = (body: string, title = 'A title'): string =>
  `<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`

describe('extractPage', () => {
  it('extracts an article and reports which step won', () => {
    const extracted = extractPage(
      page(`<article><h1>A title</h1><p>${PROSE}</p></article>`),
      POST_URL,
    )
    expect(extracted?.title).toBe('A title')
    expect(extracted?.body).toContain('hundred character minimum')
    expect(extracted?.url).toBe(POST_URL)
  })

  it('carries the markdown, not the html', () => {
    const extracted = extractPage(
      page(`<article><p><strong>Bold</strong> ${PROSE}</p></article>`),
      POST_URL,
    )
    expect(extracted?.body).toContain('**Bold**')
    expect(extracted?.body).not.toContain('<strong>')
  })

  // The whole point of the null: a page nothing could read becomes a body-less
  // clip that keeps the URL, rather than an exception the drain retries forever.
  it('returns null when there is no content to find', () => {
    expect(extractPage(page('<div></div>'), NO_CONTENT_URL)).toBeNull()
  })

  it('returns null for a shell page whose only text is a wrapper', () => {
    expect(
      extractPage(page('<div>Loading...</div>'), NO_CONTENT_URL),
    ).toBeNull()
  })

  it('falls back to the title element when the extractor found none', () => {
    const extracted = extractPage(
      page(`<main><p>${PROSE}</p></main>`, 'Fallback title'),
      POST_URL,
    )
    expect(extracted?.title).toBe('Fallback title')
  })
})

describe('extractPage and script text', () => {
  it('does not read inline script state as the page body', () => {
    const script = `var state = {${'"key":"value",'.repeat(200)}}`
    const extracted = extractPage(
      `<html><body><script>${script}</script><div>short</div></body></html>`,
      NO_CONTENT_URL,
    )
    expect(extracted?.body ?? '').not.toContain('"key":"value"')
  })

  it('still reads a real body that happens to carry a script', () => {
    const prose = 'Real prose that is comfortably past the minimum length. '
    const extracted = extractPage(
      `<html><body><script>var a=1</script><div>${prose.repeat(4)}</div></body></html>`,
      NO_CONTENT_URL,
    )
    expect(extracted?.body).toContain('Real prose')
    expect(extracted?.body ?? '').not.toContain('var a=1')
  })
})
