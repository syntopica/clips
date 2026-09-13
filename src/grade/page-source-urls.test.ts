import { describe, expect, it } from 'vitest'
import { pageSourceUrls } from './page-source-urls.ts'

const page = (frontmatter: string): string =>
  `---\n${frontmatter}\n---\n\nBody with https://example.com/in-the-body inside.\n`

describe('pageSourceUrls', () => {
  it('reads the urls under sources', () => {
    expect(
      pageSourceUrls(
        page(
          [
            'title: A page',
            'sources:',
            '  - https://medium.com/@a/one-1234567890ab',
            '  - https://example.com/two',
          ].join('\n'),
        ),
      ),
    ).toEqual([
      'https://medium.com/@a/one-1234567890ab',
      'https://example.com/two',
    ])
  })

  it('skips the free-text provenance lines the vault fold left behind', () => {
    expect(
      pageSourceUrls(
        page(
          [
            'sources:',
            '  - sample-archive clip 01KYFX6NFRDVW03ZFJXQ6W1VVG (2026-07-26)',
            '  - https://example.com/two',
          ].join('\n'),
        ),
      ),
    ).toEqual(['https://example.com/two'])
  })

  it('reads a vexa:// identity as a source url', () => {
    // A body-content newsletter has no web page: the harvest gives the mail
    // body the identity below and promotes it to a clip under that url, so
    // matching only http(s) hid evidence that was on disk.
    expect(
      pageSourceUrls(
        page(
          [
            'sources:',
            '  - vexa://digest.example/author/how-a-gpu-actually-works',
            '  - https://example.com/two',
          ].join('\n'),
        ),
      ),
    ).toEqual([
      'vexa://digest.example/author/how-a-gpu-actually-works',
      'https://example.com/two',
    ])
  })

  it('reads no other scheme', () => {
    expect(
      pageSourceUrls(
        page(
          [
            'sources:',
            '  - file:///etc/passwd',
            '  - ftp://example.com/x',
          ].join('\n'),
        ),
      ),
    ).toEqual([])
  })

  it('stops at the next frontmatter key', () => {
    expect(
      pageSourceUrls(
        page(
          [
            'sources:',
            '  - https://example.com/one',
            'updated: 2026-08-02',
          ].join('\n'),
        ),
      ),
    ).toEqual(['https://example.com/one'])
  })

  it('never reads a url out of the body', () => {
    expect(pageSourceUrls(page('title: No sources'))).toEqual([])
  })

  it('returns nothing when there is no frontmatter at all', () => {
    expect(
      pageSourceUrls('# Just a heading\n\nhttps://example.com/x\n'),
    ).toEqual([])
  })

  it('reads a url that carries an annotation after it', () => {
    const page = [
      '---',
      'sources:',
      '  - https://x.com/polydao/status/2060715587387400424 (clipped 2026-07-27,',
      '    clip_id 01KYGGCNH0HN292WZ1VQGVR2XW)',
      '---',
      'body',
    ].join('\n')
    expect(pageSourceUrls(page)).toEqual([
      'https://x.com/polydao/status/2060715587387400424',
    ])
  })

  it('still reads no url from a free-text provenance line', () => {
    const page = [
      '---',
      'sources:',
      '  - sample-archive clip 01KY (2026-07-27)',
      '---',
      'body',
    ].join('\n')
    expect(pageSourceUrls(page)).toEqual([])
  })
})
