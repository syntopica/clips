import { describe, expect, it } from 'vitest'
import { parseTickedArticles } from './parse-ticked-articles.ts'

describe('parseTickedArticles', () => {
  it('returns a ticked review line', () => {
    const markdown = [
      '## Review (1)',
      '',
      '- [x] [Every AI agent has a memory problem](https://medium.com/@ravishkhullar/okf-rag-26b9ceed44f1) - Agent memory is directly relevant.',
    ].join('\n')

    expect(parseTickedArticles(markdown, 'ai-agents')).toEqual([
      {
        url: 'https://medium.com/@ravishkhullar/okf-rag-26b9ceed44f1',
        title: 'Every AI agent has a memory problem',
        topic: 'ai-agents',
      },
    ])
  })

  it('leaves an unticked line alone', () => {
    const markdown =
      '- [ ] [Untouched](https://medium.com/@a/untouched-000000000001) - not asked for.'

    expect(parseTickedArticles(markdown, 'saas')).toEqual([])
  })

  it('accepts an uppercase tick, which some editors write', () => {
    const markdown =
      '- [X] [Shouted](https://medium.com/@a/shouted-000000000002) - why.'

    expect(parseTickedArticles(markdown, 'devtools')).toEqual([
      {
        url: 'https://medium.com/@a/shouted-000000000002',
        title: 'Shouted',
        topic: 'devtools',
      },
    ])
  })

  it('takes the plain bullets of the Ingest section and skips Rejected', () => {
    const markdown = [
      '## Ingest (1)',
      '',
      '- [Already ingested](https://medium.com/@a/already-000000000003) - reason - `01ARZ3NDEKTSV4RRFFQ69G5FAV`',
      '',
      '## Rejected (1)',
      '',
      '- [Dropped](https://medium.com/@a/dropped-000000000004) - off topic.',
    ].join('\n')

    expect(parseTickedArticles(markdown, 'other')).toEqual([
      {
        url: 'https://medium.com/@a/already-000000000003',
        title: 'Already ingested',
        topic: 'other',
      },
    ])
  })

  it('skips an unticked Review line but keeps a tick inside Rejected', () => {
    const markdown = [
      '## Review - needs your call (1)',
      '',
      '- [ ] [Left alone](https://medium.com/@a/left-000000000006) - unsure.',
      '',
      '## Rejected (1)',
      '',
      '- [x] [Rescued](https://medium.com/@a/rescued-000000000007) - off topic.',
    ].join('\n')

    expect(parseTickedArticles(markdown, 'other')).toEqual([
      {
        url: 'https://medium.com/@a/rescued-000000000007',
        title: 'Rescued',
        topic: 'other',
      },
    ])
  })

  it('keeps a title full of parentheses from swallowing the url', () => {
    const markdown =
      '- [x] [How to Use Claude Code with Kimi K3 (and Switch Models (Fast))](https://medium.com/@a/kimi-000000000005) - why.'

    expect(parseTickedArticles(markdown, 'ai-agents')).toEqual([
      {
        url: 'https://medium.com/@a/kimi-000000000005',
        title: 'How to Use Claude Code with Kimi K3 (and Switch Models (Fast))',
        topic: 'ai-agents',
      },
    ])
  })

  it('parses a body-content identity in the Ingest section', () => {
    const markdown = [
      '## Ingest (1)',
      '',
      '- [How to Serve 5 Models](vexa://digest.example/author/how-to-serve-5-models) - hands-on.',
    ].join('\n')

    expect(parseTickedArticles(markdown, 'ai-agents')).toEqual([
      {
        url: 'vexa://digest.example/author/how-to-serve-5-models',
        title: 'How to Serve 5 Models',
        topic: 'ai-agents',
      },
    ])
  })

  it('honours a tick in Rejected, because the user is overruling the classifier', () => {
    const markdown = [
      '## Rejected (1)',
      '',
      '- [x] [Wrongly dropped](https://medium.com/@a/wrong-000000000006) - off topic.',
    ].join('\n')

    expect(parseTickedArticles(markdown, 'seo')).toEqual([
      {
        url: 'https://medium.com/@a/wrong-000000000006',
        title: 'Wrongly dropped',
        topic: 'seo',
      },
    ])
  })
})
