import { describe, expect, it } from 'vitest'
import { harvestedArticles } from '../../testing/harvested-articles.ts'
import { buildTriageBatches } from './build-triage-batches.ts'
import { TRIAGE_BATCH_SIZE } from './triage-batch-size.ts'

describe('buildTriageBatches', () => {
  it('drops the trailing hex id from the slug words', () => {
    const [batch] = buildTriageBatches(harvestedArticles(1))
    expect(batch).toBe('0\tTitle 0\tpost')
  })

  it('splits at the batch size', () => {
    expect(
      buildTriageBatches(harvestedArticles(TRIAGE_BATCH_SIZE + 1)),
    ).toHaveLength(2)
    expect(
      buildTriageBatches(harvestedArticles(TRIAGE_BATCH_SIZE)),
    ).toHaveLength(1)
  })

  it('numbers lines by position in the full list, not within the batch', () => {
    const [, second] = buildTriageBatches(
      harvestedArticles(TRIAGE_BATCH_SIZE + 2),
    )
    expect(second?.split('\n')[0]).toBe(
      `${String(TRIAGE_BATCH_SIZE)}\tTitle ${String(TRIAGE_BATCH_SIZE)}\tpost`,
    )
  })

  it('keeps a title with a tab or newline on one line', () => {
    const [batch] = buildTriageBatches([
      {
        url: 'https://medium.com/@a/post-000000000000',
        title: 'Broken\ttitle\nsecond line',
        firstSeen: '2026-07-28',
        sender: 'noreply@medium.com',
        count: 1,
      },
    ])
    expect(batch).toBe('0\tBroken title second line\tpost')
  })

  it('carries the url slug so a boilerplate title still has a topic', () => {
    const [batch] = buildTriageBatches([
      {
        url: 'https://medium.com/@mayhemcode/the-7-ollama-commands-that-separate-hobbyists-99a70ab45924',
        title: 'Member only',
        firstSeen: '2026-07-28',
        sender: 'noreply@medium.com',
        count: 1,
      },
    ])
    expect(batch).toBe(
      '0\tMember only\tthe 7 ollama commands that separate hobbyists',
    )
  })

  it('returns nothing for an empty harvest', () => {
    expect(buildTriageBatches([])).toEqual([])
  })
})
