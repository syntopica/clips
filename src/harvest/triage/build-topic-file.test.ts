import { describe, expect, it } from 'vitest'
import { buildTopicFile } from './build-topic-file.ts'
import type { TriagedArticle } from './triaged-article.ts'

/** The triage run date every topic file here is built for. */
const RUN_DATE = '2026-07-29'

const article = (overrides: Partial<TriagedArticle>): TriagedArticle => ({
  url: 'https://medium.com/@a/one-000000000001',
  title: 'One',
  firstSeen: '2026-07-20',
  bucket: 'ingest',
  topic: 'ai-agents',
  reason: 'why',
  ...overrides,
})

describe('buildTopicFile', () => {
  it('counts every bucket in the summary line', () => {
    const file = buildTopicFile('ai-agents', RUN_DATE, [
      article({ bucket: 'ingest' }),
      article({
        bucket: 'review',
        url: 'https://medium.com/@a/two-000000000002',
      }),
      article({
        bucket: 'review',
        url: 'https://medium.com/@a/three-000000000003',
      }),
    ])
    expect(file).toContain('3 articles: 1 ingest, 2 review, 0 rejected.')
  })

  it('omits a section with no articles instead of printing an empty heading', () => {
    const file = buildTopicFile('seo', RUN_DATE, [
      article({ bucket: 'ingest' }),
    ])
    expect(file).toContain('## Ingest (1)')
    expect(file).not.toContain('## Rejected')
    expect(file).not.toContain('## Review')
  })

  it('explains the checkbox interface once, in the review section only', () => {
    const file = buildTopicFile('devtools', RUN_DATE, [
      article({ bucket: 'ingest' }),
      article({
        bucket: 'review',
        url: 'https://medium.com/@a/two-000000000002',
      }),
    ])
    expect(file.match(/clips harvest --promote/g)).toHaveLength(1)
  })

  it('orders each section newest first', () => {
    const file = buildTopicFile('ai-agents', RUN_DATE, [
      article({ firstSeen: '2026-07-01', title: 'Older' }),
      article({
        firstSeen: '2026-07-28',
        title: 'Newer',
        url: 'https://medium.com/@a/two-000000000002',
      }),
    ])
    expect(file.indexOf('Newer')).toBeLessThan(file.indexOf('Older'))
  })
})
