import { describe, expect, it } from 'vitest'
import { formatUnfetchedRuns } from './format-unfetched-runs.ts'

describe('formatUnfetchedRuns', () => {
  it('says nothing when every tick became a clip', () => {
    expect(formatUnfetchedRuns([])).toBe('')
  })

  it('names the run, the count and the command that retries it', () => {
    const report = formatUnfetchedRuns([
      {
        date: '2026-08-08',
        articles: [
          {
            url: 'https://medium.com/@a/one',
            title: 'One',
            topic: 'ai-agents',
          },
        ],
      },
    ])

    expect(report).toContain('2026-08-08  1 article(s)')
    expect(report).toContain('clips harvest --promote --date 2026-08-08')
    expect(report).toContain('ai-agents  https://medium.com/@a/one')
  })
})
