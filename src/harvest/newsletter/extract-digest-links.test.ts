import { describe, expect, it } from 'vitest'
import { digestLinkLine } from './digest-link-line.ts'
import { extractDigestLinks } from './extract-digest-links.ts'

const DIGEST = `# Today's highlights

[Open in app](https://rsci.app.link/?%24canonical_url=https%3A%2F%2Fmedium.com%2Fp%2F9d40ba0)

[Claude Code UltraPlan launched. I just tested it and it's better than it looks](https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97?source=email-8bf66de01196-1782605205864-digest.reader)
[The planning mode nobody asked for turned out to be the one that matters](https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97?source=email-8bf66de01196-1782605205864-digest.reader--subtitle)

[Joe Njenga](https://medium.com/@joe.njenga?source=email-8bf66de01196-1782605205864-digest.reader)
[Artificial Intelligence](https://medium.com/tag/artificial-intelligence?source=email-8bf66de01196-1782605205864-digest.reader)

[Why your RAG pipeline
   is slower than it should be](https://medium.com/data-science/why-your-rag-pipeline-is-slower-than-it-should-be-959d1a85284e?source=email-8bf66de01196-1782605205864-digest.reader)

---

[Work at Medium](https://medium.com/@zulie_at_medium/work-at-medium-959d1a85284e?source=email-8bf66de01196-1782605205864-digest.footer)
[Privacy policy](https://policy.medium.com/medium-privacy-policy-f03bf92035c9?source=email-8bf66de01196-1782605205864-digest.footer)
[Terms of service](https://policy.medium.com/medium-terms-of-service-9db0094a1e0f?source=email-8bf66de01196-1782605205864-digest.footer)
[Become a member](https://medium.com/membership?source=email-8bf66de01196-1782605205864-digest.footer)
[Sign in](https://medium.com/m/signin?source=email-8bf66de01196-1782605205864-digest.footer)
`

describe('extractDigestLinks', () => {
  it('keeps only the article links, in document order, duplicates included', () => {
    expect(extractDigestLinks(DIGEST)).toEqual([
      {
        url: 'https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97',
        title:
          "Claude Code UltraPlan launched. I just tested it and it's better than it looks",
        headingLevel: null,
      },
      {
        url: 'https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97',
        title:
          'The planning mode nobody asked for turned out to be the one that matters',
        headingLevel: null,
      },
      {
        url: 'https://medium.com/data-science/why-your-rag-pipeline-is-slower-than-it-should-be-959d1a85284e',
        title: 'Why your RAG pipeline is slower than it should be',
        headingLevel: null,
      },
    ])
  })

  it('collapses runs of whitespace inside a wrapped title', () => {
    expect(extractDigestLinks(DIGEST)[2]?.title).toBe(
      'Why your RAG pipeline is slower than it should be',
    )
  })

  it('drops titles shorter than 4 characters', () => {
    expect(
      extractDigestLinks('[AI](https://medium.com/@a/post-21a628332e97)'),
    ).toEqual([])
  })

  it('drops titles longer than 200 characters', () => {
    const title = 'x'.repeat(201)
    expect(
      extractDigestLinks(`[${title}](https://medium.com/@a/post-21a628332e97)`),
    ).toEqual([])
  })

  it('ignores non-https links, which are all mail chrome', () => {
    expect(
      extractDigestLinks('[Unsubscribe](mailto:noreply@medium.com)'),
    ).toEqual([])
  })

  it('returns nothing for a digest with no articles', () => {
    expect(
      extractDigestLinks('# Medium Events\n\nNo articles this week.'),
    ).toEqual([])
  })

  it('records the heading level, which is what separates a title from a subtitle', () => {
    const digest = [
      '  ## [OKF + RAG: The Ultimate AI Agent Architecture](https://medium.com/@r/okf-rag-26b9ceed44f1?source=email-x)',
      '  ### [Every AI agent has a memory problem. Ask it about yesterday.](https://medium.com/@r/okf-rag-26b9ceed44f1?source=email-x)',
    ].join('\n')
    const links = extractDigestLinks(digest)

    expect(links).toHaveLength(2)
    expect(links[0]?.headingLevel).toBe(2)
    expect(links[1]?.headingLevel).toBe(3)
  })

  it('does not let the title and subtitle of one article share a level', () => {
    const digest = [
      '  ## [Real Title Of The Article](https://medium.com/@r/okf-rag-26b9ceed44f1?source=email-x)',
      '  ### [A much longer subtitle sentence that would otherwise win on length](https://medium.com/@r/okf-rag-26b9ceed44f1?source=email-x)',
    ].join('\n')
    const [title, subtitle] = extractDigestLinks(digest)

    expect(title?.headingLevel).toBeLessThan(subtitle?.headingLevel ?? 0)
  })

  it('gives a link found outside any heading a null level', () => {
    expect(
      extractDigestLinks(
        '[Some Article](https://medium.com/@a/post-21a628332e97)',
      )[0]?.headingLevel,
    ).toBe(null)
  })
})

describe('extractDigestLinks over generated lines', () => {
  it('recovers a title containing a bracket, escapes removed', () => {
    const url = 'https://medium.com/@a/free-12-ai-tools-000000000001'
    const title = '[Free] 12 AI tools that replace paid subscriptions'

    expect(extractDigestLinks(digestLinkLine(2, title, url))).toEqual([
      { url, title, headingLevel: 2 },
    ])
  })

  it('indexes an h1 title so its own subtitle cannot outrank it', () => {
    const url = 'https://medium.com/@a/one-heading-000000000002'
    const body = [
      digestLinkLine(1, 'The Real Title', url),
      digestLinkLine(3, 'The subtitle that is longer than the title', url),
    ].join('\n\n')

    expect(extractDigestLinks(body)[0]?.headingLevel).toBe(1)
  })
})
