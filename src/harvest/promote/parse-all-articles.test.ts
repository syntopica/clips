import { describe, expect, it } from 'vitest'
import { parseAllArticles } from './parse-all-articles.ts'

describe('parseAllArticles', () => {
  it('takes marked and unmarked lines alike', () => {
    const markdown = [
      '## Ingest (1)',
      '',
      '- [Plain](https://medium.com/@a/plain-000000000001) - reason',
      '',
      '## Review',
      '',
      '- [ ] [Unticked](https://medium.com/@a/unticked-000000000002) - reason',
      '- [x] [Ticked](https://medium.com/@a/ticked-000000000003) - reason',
      '- [ingested] [Done](https://medium.com/@a/done-000000000004) - reason',
    ].join('\n')
    expect(parseAllArticles(markdown, 'devtools').map((a) => a.title)).toEqual([
      'Plain',
      'Unticked',
      'Ticked',
      'Done',
    ])
  })

  it('skips articles already known deleted upstream', () => {
    const markdown =
      '- [gone-410] [Deleted](https://medium.com/@a/deleted-000000000005) - reason'
    expect(parseAllArticles(markdown, 'devtools')).toEqual([])
  })

  it('carries the topic through', () => {
    const markdown = '- [One](https://medium.com/@a/one-000000000006)'
    expect(parseAllArticles(markdown, 'saas')[0]?.topic).toBe('saas')
  })

  it('ignores lines that are not article entries', () => {
    expect(parseAllArticles('# Title\n\nSome prose.\n', 'other')).toEqual([])
  })
})
